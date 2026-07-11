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


async def handle_edit_message(data: dict, room_id: int, db):
    new_content = data.get("content")
    message_id = data.get("message_id")

    if not message_id or not new_content:
        return
    
    message = db.query(Message).filter_by(id=message_id, room_id=room_id).first()
    if not message:
        return
    
    message.content = new_content
    db.commit()
    db.refresh(message)

    manager.broadcast(
        room_id,
        {
            "type": "edit",
            "id": message.id,
            "content": message.content,
            "room_id": room_id,
        }
    )


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
    await manager.broadcast(
        room_id=room_id, message={"type": "join", "username": current_user.username}
    )

    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content")
            if not content:
                continue

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
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(
            room_id=room_id, user_id=current_user.id, websocket=websocket
        )
        await manager.broadcast(
            room_id, {"type": "leave", "username": current_user.username}
        )
        db.close()
