from fastapi import Depends, HTTPException, status
from fastapi.routing import APIRouter
from sqlalchemy.orm import Session
from database.schema import UserCreateSchema, UserResponseSchema
from database.database import get_db
from database.models import User

router = APIRouter()


@router.post("/register", response_model=UserResponseSchema)
def register(request: UserCreateSchema, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter_by(username=request.username, password_hash=request.password)
        .first()
    )

    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="user allready exists!")

    return existing_user
