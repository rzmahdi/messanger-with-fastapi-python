from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class UserBaseSchema(BaseModel):
    username: str
    display_name: str
    bio: str | None = None
    profile_pic: str | None = None


class UserCreateSchema(BaseModel):
    username: str
    display_name: str
    password: str
    security_question: str
    security_answer: str


class UserLoginSchema(BaseModel):
    username: str
    password: str

class UserResponseSchema(UserBaseSchema):
    id: int
    created_at: datetime

class UserForgotPasswordSchema(BaseModel):
    username: str
    security_answer: str

class UserResetPasswordSchema(BaseModel):
    new_password: str
    reset_token: str

class UserEditSchema(BaseModel):
    username: str
    display_name: str
    bio: str | None = None

class Token(BaseModel):
    access_token: str
    refresh_token: str

class RoomResponseSchema(BaseModel):
    id: UUID
    name: str
    created_by: int
    created_at: datetime
    creator: UserBaseSchema

class RoomCreateSchema(BaseModel):
    name: str

class RoomEditSchema(BaseModel):
    name: str

class ReplyPreviewSchema(BaseModel):
    id: int
    user: UserBaseSchema
    content: str
    is_deleted: bool

    class Config:
        from_attributes = True

class MessageResponseSchema(BaseModel):
    id: int
    content: str
    user_id: int
    room_id: UUID
    reply_id: int | None
    created_at: datetime
    is_edited: bool
    is_deleted: bool
    user: UserBaseSchema
    reply: ReplyPreviewSchema | None = None

    class Config:
        from_attributes = True

class MessageCreateSchema(BaseModel):
    content: str

class MessageEditSchema(BaseModel):
    content: str


class RefreshTokenSchema(BaseModel):
    refresh_token: str