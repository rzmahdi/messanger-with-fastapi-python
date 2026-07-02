from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from services.auth_service import get_current_user
from services.room import room_exist
from database.models import Message, User
from database.schema import MessageCreateSchema, MessageResponseSchema
from typing import List


router = APIRouter()

@router.get("/room/{room_id}/messages", response_model=List[MessageResponseSchema])
def get_messages(room_id: int, limit: int = 20, offset: int = 0, db: Session=Depends(get_db)):
    if not room_exist(room_id, db):
        raise HTTPException(404, "Room does not exists!")
    
    return(
        db.query(Message)
        .filter_by(room_id=room_id)
        .order_by(Message.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )


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