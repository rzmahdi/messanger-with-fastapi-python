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


class MessageCreateSchema(BaseModel):
    content: str