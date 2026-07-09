from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from database.models import Room, User
from database.schema import RoomResponseSchema, RoomCreateSchema
from database.database import get_db
from services.auth_service import get_current_user
from typing import List

router = APIRouter()

@router.get("/rooms", response_model=List[RoomResponseSchema])
def retrive_rooms(request: Request, room_name: str | None = None, db: Session=Depends(get_db)):
    query = db.query(Room)

    if room_name:
        query = query.filter(Room.name.ilike(f"%{room_name}%"))

    return query.all()


@router.post("/rooms", status_code=201)
def create_room(request: RoomCreateSchema, user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    new_room = Room(name=request.name, created_by=user.id)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)