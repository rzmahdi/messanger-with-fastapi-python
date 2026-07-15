from services.connection_manager import ConnectionManager
from services.auth_service import get_user_from_token
from fastapi import APIRouter, WebSocket, HTTPException, WebSocketDisconnect
from database.database import SessionLocal
from database.models import Room, Message

manager = ConnectionManager()
router = APIRouter()


async def handle_new_message(data: dict, room_id: int, current_user, db):
    content = data.get("content")
    if not content:
        return
    
    room = db.query(Room).filter_by(id=room_id).first()
    if not room:
        return

    new_message = Message(
        user_id=current_user.id, room_id=room_id, content=content
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    await manager.broadcast(
        room_id,
        {
            "type": "message",
            "id": new_message.id,
            "content": new_message.content,
            "room_id": room_id,
            "created_at": str(new_message.created_at),
            "user": {"id": current_user.id, "username": current_user.username},
        },
    )


async def handle_delete_message(data: dict, room_id: int, current_user, db):
    message_id = data.get("message_id")
    if not message_id:
        return
    
    message = db.query(Message).filter_by(id=message_id, room_id=room_id).first()
    if not message:
        return
    
    if not message.user_id == current_user.id:
        return
    
    db.delete(message)
    db.commit()

    await manager.broadcast(
        room_id,
        {
            "type": "delete",
            "message_id": message_id,
            "room_id": room_id
        }
    )


async def handle_edit_message(data: dict, room_id: int, current_user, db):
    new_content = data.get("content")
    message_id = data.get("message_id")

    if not message_id or not new_content:
        return
    
    message = db.query(Message).filter_by(id=message_id, room_id=room_id).first()

    if not message.user_id == current_user.id:
        return

    if not message:
        return
    
    message.content = new_content
    message.is_edited = True
    db.commit()
    db.refresh(message)

    await manager.broadcast(
        room_id,
        {
            "type": "edit",
            "id": message.id,
            "content": message.content,
            "room_id": room_id,
        }
    )


async def handle_edit_room_name(data: dict, room_id: int, current_user, db):
    new_room_name = data.get("name")

    if not room_id or not new_room_name:
        return
    
    room = db.query(Room).filter_by(id=room_id).first()
    if not room:
        return
    
    if db.query(Room).filter_by(name=new_room_name).first():
        await manager.broadcast(
            room_id,
            {
                "type": "error",
                "content": "room_name_already_exists"
            }
        )

    if room.created_by != current_user.id:
        await manager.broadcast(
            room_id,
            {
                "type": "error",
                "content": "you do not have the permission"
            }
        )
    
    room.name = new_room_name
    db.commit()
    db.refresh(room)

    await manager.broadcast(
        room_id,
        {
            "type": "room_edit_name",
            "id": room.id,
            "new_name": room.name,
            "room_id": room_id,
        }
    )


async def handle_remove_room(data: dict, room_id: int, current_user, db):
    if not room_id:
        return
    
    room = db.query(Room).filter_by(id=room_id, created_by=current_user.id).first()
    if not room:
        return
    
    db.delete(room)
    db.commit()

    await manager.broadcast(
        room_id,
        {
            "type": "room_deleted"
        }
    )
    await manager.disconnect_all(room_id)


@router.websocket("/ws/{room_id}/messages")
async def room_chat(websocket: WebSocket, room_id: int):
    db = SessionLocal()
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close()
        return

    try:
        current_user = get_user_from_token(token, db)
    except HTTPException:
        await websocket.close()
        return

    if not current_user:
        await websocket.close()
        return

    existing_room = db.query(Room).filter_by(id=room_id).first()
    if not existing_room:
        await websocket.close()
        return

    await manager.connect(room_id, current_user.id, current_user.username, websocket)
    online_user_count = len(manager.active_connections.get(room_id))

    await manager.broadcast(
        room_id=room_id,
        message={
            "type": "join",
            "username": current_user.username,
            "online_user_count": online_user_count,
        }
    )

    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type", "message")

            if event_type == "message":
                await handle_new_message(data, room_id, current_user, db)
            elif event_type == "edit":
                await handle_edit_message(data, room_id, current_user, db)
            elif event_type == "delete":
                await handle_delete_message(data, room_id, current_user, db)
            elif event_type == "room_edit_name":
                await handle_edit_room_name(data, room_id, current_user, db)

    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(
            room_id=room_id, user_id=current_user.id, websocket=websocket
        )
        online_user_count = len(manager.active_connections.get(room_id, {}))

        await manager.broadcast(
            room_id=room_id,
            message={
                "type": "leave",
                "username": current_user.username,
                "online_user_count": online_user_count,
            }
        )
        db.close()
