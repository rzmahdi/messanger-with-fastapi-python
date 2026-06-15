from pydantic import BaseModel
from datetime import datetime

class UserBaseSchema(BaseModel):
    id: int
    username: str

class UserCreateSchema(UserBaseSchema):
    password: str

class UserResponseSchema(UserBaseSchema):
    created_at: datetime