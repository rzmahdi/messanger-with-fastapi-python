from pydantic import BaseModel
from datetime import datetime

class UserBaseSchema(BaseModel):
    username: str

class UserCreateSchema(UserBaseSchema):
    password: str

class UserLoginSchema(UserBaseSchema):
    password: str

class UserResponseSchema(UserBaseSchema):
    id: int
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str

class RoomResponseSchema(BaseModel):
    id: int
    name: str
    created_by: int
    created_at: datetime
    creator: UserBaseSchema

class RoomCreateSchema(BaseModel):
    name: str

class RoomEditSchema(BaseModel):
    name: str


class MessageResponseSchema(BaseModel):
    id: int
    content: str
    user_id: int
    room_id: int
    created_at: datetime
    is_edited: bool
    user: UserBaseSchema

class MessageCreateSchema(BaseModel):
    content: str

class MessageEditSchema(BaseModel):
    content: str


class RefreshTokenSchema(BaseModel):
    refresh_token: str