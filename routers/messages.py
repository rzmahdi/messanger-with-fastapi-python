from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from services.auth_service import get_current_user
from services.room import room_exist
from database.models import Message, User
from database.schema import MessageCreateSchema, MessageResponseSchema, MessageEditSchema
from typing import List


router = APIRouter()

@router.get("/room/{room_id}/messages", response_model=List[MessageResponseSchema])
def get_messages(room_id: int, limit: int = 20, before_id: int | None=None, db: Session=Depends(get_db)):
    if not room_exist(room_id, db):
        raise HTTPException(404, "Room does not exists!")
    
    query = db.query(Message).filter_by(room_id=room_id)
    
    if before_id:
        query = query.filter(Message.id < before_id)

    messages = (
        query.order_by(Message.id.desc())
        .limit(limit)
        .all()
    )

    return list(reversed(messages))


@router.post("/room/{room_id}/messages", status_code=201)
def send_message(
    room_id: int,
    request: MessageCreateSchema,
    current_user: User=Depends(get_current_user),
    db: Session=Depends(get_db)):

    if not room_exist(room_id, db):
        raise HTTPException(404, "Room does not exists!")

    new_message = Message(
        content=request.content,
        user_id=current_user.get("id"),
        room_id=room_id
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)


@router.patch("/room/{room_id}/messages/{message_id}")
def edit_message(
    room_id: int,
    message_id: int,
    request: MessageEditSchema,
    current_user: User=Depends(get_current_user),
    db: Session=Depends(get_db)
    ):

    if not room_exist(room_id, db):
        raise HTTPException(404, "Room not found!")

    message = db.query(Message).filter_by(id=message_id).first()
    if not message:
        raise HTTPException(404, "Message not found!")
    
    if message.user_id != current_user.id:
        raise HTTPException(403, "You can not edit this message!")
    
    message.content = request.content
    db.commit()
    db.refresh(message)

    return message
