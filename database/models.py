from database.database import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime

SECURITY_QUESTIONS = [
    "What is the name of your first pet?",
    "What is the name of the city where you were born?",
    "What was the name of your favorite teacher at school?",
    "What was the name of the first school you went to?",
    "What is your favorite food?",
]


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, autoincrement=True, primary_key=True)
    username = Column(String(40), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    security_question = Column(
        Enum(
            *SECURITY_QUESTIONS,
            name="security_questions",
            native_enum = False,
            create_constraint=True,
            validate_strings=True,            
            ),
        nullable=False
    )
    security_answer_hash = Column(Text, nullable=False)

    rooms = relationship("Room", back_populates="creator")
    messages = relationship("Message", back_populates="user")


class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, autoincrement=True, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)

    creator = relationship("User", back_populates="rooms")
    messages = relationship("Message", back_populates="room", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, autoincrement=True, primary_key=True)
    content = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    reply_id = Column(Integer, ForeignKey("messages.id"), nullable=True)

    user = relationship("User", back_populates="messages")
    room = relationship("Room", back_populates="messages")
    reply = relationship("Message", remote_side=[id])
