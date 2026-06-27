from pwdlib import PasswordHash
from database.models import User
from datetime import datetime, timedelta
from jose import jwt, JWTError
from typing import Annotated
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer


password_hash = PasswordHash.recommended()
SECRET_KEY = "87sadf230bjwe27240iud23973ne3ui23fg486hdf23h389ye39gd902jv52d6dm289"
ALGORITHM = "HS256"
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="/login")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str):
    return password_hash.verify(password, hashed_password)


def authenticate_user(username: str, password: str, db):
    user = db.query(User).filter_by(username=username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    
    return user


def create_access_token(username: str, user_id: int, exp_delta: timedelta):
    encode = {"sub": username, "id": user_id, "exp": datetime.now() + exp_delta}
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        user_id = payload.get("id")

        if username is None or user_id is None:
            raise HTTPException(401, "Could not validate user!")
        return {"username": username, "id": user_id}
    
    except JWTError:
        raise HTTPException(401, "Could not validate user!")
