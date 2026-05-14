from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime

class UserFullInf(BaseModel):
    first_name: str = Field(min_length=3, max_length=50, description="first name")
    last_name: str = Field(min_length=3, max_length=50, description="last name")
    email: EmailStr = Field(description="email")
    password: str = Field(min_length=8, description="password")

class UserFullInfResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

class ChatListResponse(BaseModel):
    chat_id: int
    another_user_id: int
    first_name: str
    last_name: str
    from_user_id: Optional[int]
    message_text: Optional[str]
    last_message_time: Optional[datetime]

class UserLoginInf(BaseModel):
    email: EmailStr = Field(description="email")
    password: str = Field(min_length=8, description="password")

class UserRegisterInf(BaseModel):
    email: EmailStr = Field(description="email")
    otp: str = Field(description="otp", max_length=6, min_length=6)

class UserInfResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str

    model_config = ConfigDict(from_attributes=True)

class MessageCreate(BaseModel):
    chat_id: int
    message_text: str

class MessagesResponse(BaseModel):
    message_id: int
    chat_id: int
    from_user_id: int
    message_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


