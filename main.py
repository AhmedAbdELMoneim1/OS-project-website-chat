from typing import Literal, List, Dict
import json
import uuid

import asyncio
from fastapi import FastAPI, HTTPException, Cookie, Depends, status, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import FileResponse, Response
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis

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
# :TODO manage workers and redis and how to create it   ----> DOME ✅
# :TODO user status --> make message not_sent -> sent -> sent&read   ----> skipped now

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_pool = redis.ConnectionPool.from_url("redis://localhost", decode_responses=True)
r = redis.Redis(connection_pool=redis_pool)

SESSION_TTL = 60 * 60 * 24 * 7 # "session to live" 60 sec * 60 min * 24 hours * 7 days

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

async def get_user_session(session_id: str | None = Cookie(default=None)):
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="not authenticated"
        )
    user_id = await r.get(f"session:{session_id}")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="session expired or invalid"
        )

    return user_id

@app.get("/")
async def root():
    return FileResponse("front_versions/index.html")

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

    await r.setex(f"session:{session_id}", SESSION_TTL, user.user_id)

    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        max_age=SESSION_TTL,
        samesite="lax",
        secure=False # Ture in real deployment in https not http :)
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
async def load_chats(user_id: int = Depends(get_user_session), db: AsyncSession = Depends(get_db)):
    chats = await load_user_chats_with_last_msg_id(db, user_id)
    return chats

@app.get("/loadUserChat", response_model=List[MessagesResponse])
async def loadUserChat(chat_id: int, from_datetime: str,
                       user_id: int = Depends(get_user_session), db: AsyncSession = Depends(get_db)):

    # must check privacy --> chat_id into user chats or not ?!
    if not await check_user_in_chat(db, user_id, chat_id):
        raise HTTPException(
            status_code=status.HTTP_406_NOT_ACCEPTABLE,
            detail="don't have a permission to open this chat"
        )
    msgs = await load_chat_messages(db, chat_id=chat_id, from_datetime=from_datetime)
    return msgs

@app.post("/addChat") # just create a chat after check if exist
async def add_chat(other_user_id: int,
                   user_id: int = Depends(get_user_session), db: AsyncSession = Depends(get_db)):

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

        # mmm... assume user have mul sessions
        # this is isolated by every worker
        self.active_connections: dict[int, List[WebSocket]] = {}
        # background Redis listener for users sessions into this worker
        self.pubsub_tasks: Dict[int, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, user_id: int, db: AsyncSession):

        await websocket.accept()
        all_users_chats = await load_user_chats(db, user_id)
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []

            # should start a single Redis listener for this user on this worker ...
            await self.__start_redis_listener_to_user_inbox(user_id)

            # user_sessions_number key for every user ... use it to check if it first session to the user
            # if first session will be 1
            active_sessions = await r.incr(f"user_sessions_number:{user_id}")

            if active_sessions == 1:
                await change_user_status(db, user_id, "online")
                await websocket_manager.broadcast_to_users(
                    all_users_chats,
                    {"type": "user_state", "user_id": user_id, "user_state": "online"}
                )
        self.active_connections[user_id].append(websocket)

        all_users_status = [
            user_id for user_id in all_users_chats if await r.get(f"user_sessions_number:{user_id}")  # don't do this -- should be got from db with chats :)
        ]

        await websocket.send_json({"online_users": all_users_status})


    async def __start_redis_listener_to_user_inbox(self, user_id: int):
        pubsub = r.pubsub()
        await pubsub.subscribe(f"user_inbox:{user_id}")

        async def listen():
            try:
                async for message in pubsub.listen():
                    if message['type'] == 'message':
                        msg = json.loads(message['data'])

                        for ws in self.active_connections.get(user_id, []):
                            await ws.send_json(msg)

            except asyncio.CancelledError:
                await pubsub.unsubscribe(f"user_inbox:{user_id}")
                await pubsub.close()

        self.pubsub_tasks[user_id] = asyncio.create_task(listen())

    async def disconnect(self, websocket: WebSocket, user_id: int, db: AsyncSession):
        if user_id in self.active_connections and websocket in self.active_connections[user_id]:
            self.active_connections[user_id].remove(websocket)

            # check if active sessions into this worker for this user
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

                # if yes "no sessions here" so ... cancel the listener task to this session
                if user_id in self.pubsub_tasks:
                    self.pubsub_tasks[user_id].cancel()
                    del self.pubsub_tasks[user_id]

        # number of session Decrement by 1
        active_sessions = await r.decr(f"user_sessions_number:{user_id}")

        if active_sessions <= 0: # ... this user close all sessions
            await change_user_status(db, user_id, "offline")
            all_users_chats = await load_user_chats(db, user_id)
            await self.broadcast_to_users(
                all_users_chats,
                {"type": "user_state", "user_id": user_id, "user_state": "offline"}
            )
            await r.delete(f"user_sessions_number:{user_id}")
            # mmmm... the channel deleted by default when no subscribers to it ...

    async def send_personal_message(self, target_user_id: int, message: dict):
        # send a msg to another user inbox ... can be here in this worker or in another :|
        await r.publish(f"user_inbox:{target_user_id}", json.dumps(message))

    async def broadcast_to_users(self, participant_ids: List[int], message: dict):
        for user_id in participant_ids:
            await self.send_personal_message(user_id, message)

websocket_manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: AsyncSession = Depends(get_db) ):
    session_id = websocket.cookies.get("session_id")

    # session validate
    if not session_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = await r.get(f"session:{session_id}")

    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = int(user_id)

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
        await websocket_manager.disconnect(websocket, user_id, db)


@app.post("/sendMessages", response_model=MessagesResponse)
async def user_send_message(msg_data: MessageCreate,
                       user_id: int = Depends(get_user_session), db: AsyncSession = Depends(get_db)):
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
                            user_id: int = Depends(get_user_session), db: AsyncSession = Depends(get_db)):
    await change_user_status(db, user_id, state)

    await websocket_manager.broadcast_to_users(
        await load_user_chats(db, user_id),
        {"type": "user_state", "user_id": user_id, "user_state": state}
    )
    return status.HTTP_200_OK


@app.get("/me", response_model=UserFullInfResponse)
async def get_current_user(request: Request, db: AsyncSession = Depends(get_db)):
    """
    created this function to check if user session cookie still exists
    to join direct without login every time ...
    """

    session_id = request.cookies.get("session_id")
    user_id = await r.get(f"session:{session_id}")

    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = await get_user_full_inf(db=db, user_id=int(user_id))

    return user
