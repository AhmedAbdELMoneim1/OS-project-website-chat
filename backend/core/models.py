from sqlalchemy import Column, Integer, String, Date, ForeignKey, func
from sqlalchemy.orm import relationship, Mapped, mapped_column # orm --> Object-Relational Manager
from core.database import Base
from datetime import datetime

class UserINF(Base):
    __tablename__ = "users_inf"

    user_id = Column(Integer, primary_key=True)
    first_name = Column(String(255), index=True, nullable=False)
    last_name = Column(String(255), index=True, nullable=False)
    date_created = Column(Date)

    login_info = relationship("UserLoginINF", back_populates="user", uselist=False)
    status = relationship("UserStatus", back_populates="user", uselist=False)
    messages = relationship("ChatsMessages", back_populates="sender")

class UserLoginINF(Base):
    __tablename__ = "users_login_inf"

    user_id = Column(Integer, ForeignKey("users_inf.user_id"), primary_key=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

    user = relationship("UserINF", back_populates="login_info")

class UserStatus(Base):
    __tablename__ = "users_status"

    user_id = Column(Integer, ForeignKey("users_inf.user_id"), primary_key=True)
    state = Column(String(255), nullable=False)

    user = relationship("UserINF", back_populates="status")


class Chats(Base):
    __tablename__ = "chats"

    chat_id = Column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


    participants = relationship("ChatParticipants", back_populates="chat")
    messages = relationship("ChatsMessages", back_populates="chat")

class ChatParticipants(Base):
    __tablename__ = "chat_participants"

    chat_id = Column(Integer, ForeignKey("chats.chat_id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users_inf.user_id", ondelete="CASCADE"), primary_key=True)
    last_message_id = Column(Integer, ForeignKey("chats_messages.message_id", ondelete="SET NULL"), nullable=True)

    chat = relationship("Chats", back_populates="participants")
    last_message = relationship("ChatsMessages", foreign_keys=[last_message_id])


class ChatsMessages(Base):
    __tablename__ = "chats_messages"

    message_id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey("chats.chat_id", ondelete="CASCADE"))
    from_user_id = Column(Integer, ForeignKey("users_inf.user_id", ondelete="CASCADE"))
    message_text = Column(String(1000), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    chat = relationship("Chats", back_populates="messages")
    sender = relationship("UserINF", back_populates="messages")

