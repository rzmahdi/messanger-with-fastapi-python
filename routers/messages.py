from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import Message

router = APIRouter()

@router.get("/room/{room_id}/messages")
def get_messages(room_id: int, limit: int = 20, offset: int = 0, db: Session=Depends(get_db)):
    return(
        db.query(Message)
        .filter_by(room_id=room_id)
        .order_by(Message.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )