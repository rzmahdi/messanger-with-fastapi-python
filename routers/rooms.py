from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from database.models import Room, User
from database.schema import RoomResponseSchema, RoomCreateSchema, RoomEditSchema
from database.database import get_db
from services.auth_service import get_current_user
from services.room import room_exist
from typing import List
from routers.websocket import manager

router = APIRouter()

@router.get("/rooms", response_model=List[RoomResponseSchema])
def retrive_rooms(request: Request, room_name: str | None = None, db: Session=Depends(get_db)):
    query = db.query(Room)

    if room_name:
        query = query.filter(Room.name.ilike(f"%{room_name}%"))

    return query.all()


@router.post("/rooms", status_code=201)
def create_room(request: RoomCreateSchema, user: User=Depends(get_current_user), db: Session=Depends(get_db)):
    if db.query(Room).filter_by(name=request.name).first():
        raise HTTPException(409, "a Room with this name already exists!")

    new_room = Room(name=request.name, created_by=user.id)
    db.add(new_room)
    db.commit()
    db.refresh(new_room)


@router.patch("/rooms/{room_id}")
def edit_room(
    request: RoomEditSchema,
    room_id: str,
    user: User=Depends(get_current_user),
    db: Session=Depends(get_db)
    ):

    if not room_exist(room_id, db):
        raise HTTPException(404, "Room does not exists!")
    
    if db.query(Room).filter_by(name=request.name).first():
        raise HTTPException(409, "a Room with this name already exists!")
    
    room = db.query(Room).filter_by(id=room_id, created_by=user.id).first()
    if not room:
        raise HTTPException(403, "you can not edit this room!")
    
    room.name = request.name
    db.commit()
    db.refresh(room)

    return room

@router.delete("/rooms/{room_id}")
async def delete_room(
    request: Request,
    room_id: str,
    user: User=Depends(get_current_user),
    db: Session=Depends(get_db)
    ):

    if not room_exist(room_id, db):
        raise HTTPException(404, "Room does not exists!")
    
    room = db.query(Room).filter_by(id=room_id, created_by=user.id).first()
    if not room:
        raise HTTPException(403, "you can not delete this room!")
    
    db.delete(room)
    db.commit()

    await manager.broadcast(
        room_id,
        {
            "type": "room_deleted"
        }
    )

    await manager.disconnect_all(room_id)