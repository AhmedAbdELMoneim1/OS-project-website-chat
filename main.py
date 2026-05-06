from typing import Literal, List
import json
import uuid

from fastapi import FastAPI, HTTPException, Cookie, Depends, status, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware

from core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

from DataLayer.login import check_user
from DataLayer.messages import load_chat_messages, send_message
from DataLayer.user import create_user, change_user_status, check_user_id_exist, get_user_full_inf
from DataLayer.chats import (load_user_chats_with_last_msg_id, create_two_users_chat,
                             check_user_in_chat, check_2_users_in_chat, load_user_chats,
                             get_other_user_from_chat)

from DTO.schemas import (UserFullInf, ChatListResponse, UserLoginInf,
                         UserInfResponse, MessagesResponse, MessageCreate,
                         UserFullInfResponse)

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# :TODO add real email auth key checker
# :TODO manage workers and redis and how to create it
# :TODO user statues --> make message not_sent -> sent -> sent&read

app = FastAPI()

# manage server origins ips mmm.. server setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_users_sessions = {}

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_user_session(session_id: str | None = Cookie(default=None)):
    if not session_id or session_id not in active_users_sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated or session expired"
        )
    return active_users_sessions[session_id]

@app.get("/")
async def root():
    return FileResponse("front_versions/index_v2.html")

@app.post("/login")
async def login(
            user_credentials: UserLoginInf,
            response: Response, # to create the cookie that manage the session in user browser
            db: AsyncSession = Depends(get_db)
    ):
    user = await check_user(db, user_credentials.email)

    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    session_id = str(uuid.uuid4()) # create a session id

    active_users_sessions[session_id] = {
        "user_id": user.user_id,
        "state": "online",
        "typing": 0
    }

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
        secure=False
    )

    return {"message": "Login successful"}

@app.post("/register", response_model=UserInfResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserFullInf, db: AsyncSession = Depends(get_db)):
    existing_user = await check_user(db, user_data.email)

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    new_user = await create_user(db,
                                 first_name=user_data.first_name,
                                 last_name=user_data.last_name,
                                 email=user_data.email,
                                 password_hash=get_password_hash(user_data.password))
    return new_user

@app.get("/loadChats", response_model=List[ChatListResponse])
async def load_chats(user_session: dict = Depends(get_user_session), db: AsyncSession = Depends(get_db)):
    user_id = user_session["user_id"]
    chats = await load_user_chats_with_last_msg_id(db, user_id)
    return chats

@app.get("/loadUserChat", response_model=List[MessagesResponse])
async def loadUserChat(chat_id: int, from_datetime: str,
                       user_session: dict = Depends(get_user_session), db: AsyncSession = Depends(get_db)):

    # must check privacy --> chat_id into user chats or not ?!
    user_id = user_session["user_id"]
    if not await check_user_in_chat(db, user_id, chat_id):
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="don't have a permission to open this chat"
        )
    msgs = await load_chat_messages(db, chat_id=chat_id, from_datetime=from_datetime)
    return msgs

@app.post("/addChat") # just create a chat after check if exist
async def add_chat(other_user_id: int,
                   user_session: dict = Depends(get_user_session), db: AsyncSession = Depends(get_db)):
    user_id = user_session["user_id"]

    if not await check_user_id_exist(db, other_user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="user id not exist"
        )
    existing_chat_id = await check_2_users_in_chat(db, user_id, other_user_id)

    if existing_chat_id:
        return {"chat_id": existing_chat_id}

    chat_id = await create_two_users_chat(db, user_id, other_user_id)
    return {"chat_id": chat_id}


# https://fastapi.tiangolo.com/advanced/websockets/#handling-disconnections-and-multiple-clients
class ConnectionManager:
    def __init__(self):
        # mmm.. i assume user have mul sessions
        self.active_connections: dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int, db: AsyncSession):
        await websocket.accept()
        all_users_chats = await load_user_chats(db, user_id)
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
            await change_user_status(db, user_id, "online")
            await websocket_manager.broadcast_to_users(
                all_users_chats,
                {"type": "user_state", "user_id": user_id, "user_state": "online"}
            )
        all_users_status = [
            user_id for user_id in all_users_chats if user_id in self.active_connections
        ]
        await websocket.send_json({"online_users": all_users_status})
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections and websocket in self.active_connections[user_id]:
            self.active_connections[user_id].remove(websocket)

            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for websocket_session in self.active_connections[user_id]:
                await websocket_session.send_json(message)

    async def broadcast_to_users(self, participant_ids: List[int], message: dict):
        for user_id in participant_ids:
            await self.send_personal_message(user_id, message)

websocket_manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: AsyncSession = Depends(get_db) ):
    session_id = websocket.cookies.get("session_id")

    # session validate
    if not session_id or session_id not in active_users_sessions:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = active_users_sessions[session_id]["user_id"]
    await websocket_manager.connect(websocket, user_id, db)
    try:
        while True:
            data = await websocket.receive_text()
            event = json.loads(data)

            if event.get("type") == "typing":
                # {"type": "typing", "on": true, "chat_id": 123, "receiver_id": 125}
                chat_id = event.get("chat_id")
                receiver_id = event.get("receiver_id")
                typing_work = event.get("on")
                await websocket_manager.send_personal_message(
                    receiver_id,
                    {
                    "type": "typing",
                    "on": typing_work,
                    "chat_id": chat_id,
                    "sender_id": user_id
                    }
                )

    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, user_id)
        await change_user_status(db, user_id, "offline")
        await websocket_manager.broadcast_to_users(
            await load_user_chats(db, user_id),
            {"type": "user_state", "user_id": user_id, "user_state": "offline"}
        )

@app.post("/sendMessages", response_model=MessagesResponse)
async def user_send_message(msg_data: MessageCreate,
                       user_session: dict = Depends(get_user_session), db: AsyncSession = Depends(get_db)):
    user_id = user_session["user_id"]

    if not await check_user_in_chat(db, user_id, msg_data.chat_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="don't have a permission to send msg here"
        )
    msg = await send_message(
        db=db,
        chat_id=msg_data.chat_id,
        from_user_id=user_id,
        message_text=msg_data.message_text
    )

    other_user = await get_other_user_from_chat(db, chat_id=msg.chat_id, user_id=user_id)

    # send to other-user sessions
    await websocket_manager.send_personal_message(
        other_user.user_id,
        {"type": "message",
         "message_id": msg.message_id,
         "chat_id": msg.chat_id,
         "from_user_id": user_id,
         "message_text": msg.message_text,
         "created_at": msg.created_at.isoformat()})
    # send to the user sessions
    await websocket_manager.send_personal_message(
        user_id,
        {"type": "message",
         "message_id": msg.message_id,
         "chat_id": msg.chat_id,
         "from_user_id": user_id,
         "message_text": msg.message_text,
         "created_at": msg.created_at.isoformat()})

    return msg

@app.get("/changeUserState")
async def change_user_state(state: Literal["online", "offline"],
                            user_session: dict = Depends(get_user_session), db: AsyncSession = Depends(get_db)):
    user_id = user_session["user_id"]
    await change_user_status(db, user_id, state)

    await websocket_manager.broadcast_to_users(
        await load_user_chats(db, user_id),
        {"type": "user_state", "user_id": user_id, "user_state": state}
    )
    return status.HTTP_200_OK


@app.get("/me", response_model=UserFullInfResponse)
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):

    session_id = request.cookies.get("session_id")

    if session_id not in  active_users_sessions:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = active_users_sessions[session_id]["user_id"]
    user = await get_user_full_inf(db=db, user_id=user_id)

    return user
