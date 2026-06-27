from fastapi import Depends, HTTPException, status
from fastapi.routing import APIRouter
from sqlalchemy.orm import Session
from database.schema import UserCreateSchema, Token, UserResponseSchema
from database.database import get_db
from database.models import User
from services.auth_service import hash_password, authenticate_user, create_access_token
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated
from datetime import timedelta

router = APIRouter()


@router.post("/register", response_model=UserResponseSchema)
def register(request: UserCreateSchema, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter_by(username=request.username)
        .first()
    )
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="user allready exists!")
    

    new_user = User(username=request.username, password_hash=hash_password(request.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session=Depends(get_db)):
    user = authenticate_user(form_data.username, form_data.password, db)
    
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "username or password are wrong!")
    
    token = create_access_token(user.username, user.id, timedelta(minutes=20))
    return {"access_token": token, "token_type": "bearer"}