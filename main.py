import uuid
from fastapi import FastAPI, HTTPException, Cookie, Depends, WebSocket
from fastapi.responses import FileResponse
from datetime import datetime
from pydantic import BaseModel
from typing import Literal

class USER(BaseModel):
    first_name: int
    last_name: int
    email: int

app = FastAPI()

active_users = {}

def get_user_session(session_id: str | None = Cookie(default=None)):
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if session_id not in active_users:
        raise HTTPException(status_code=401, detail="Session expired or invalid")

    # active_admin_sessions[session_id]["last_active"] = datetime.now()

    return active_users[session_id]

def create_user_session():
    pass

@app.get("/")
def root():
    return FileResponse("front_versions/index.html")

@app.post("/login")
def login(email: str, password: str):
    pass

@app.post("/register")
def new_user(user: USER, user_session: dict = Depends(get_user_session)):
    pass

@app.get("/loadChats")
def load_chats(user_id: int, user_session: dict = Depends(get_user_session)):
    pass

@app.get("/addFriend") # just create a chat
def add_friend(user_id, friend_id: int, user_session: dict = Depends(get_user_session)):

    pass

@app.get("/sendMessages")
def send_message(chat_id: int, from_user_id: int ,message_text: str, user_session: dict = Depends(get_user_session)):
    pass

@app.get("/changeUserState")
def change_user_state(user_id: int, state: Literal["online", "offline"], user_session: dict = Depends(get_user_session)):
    pass
