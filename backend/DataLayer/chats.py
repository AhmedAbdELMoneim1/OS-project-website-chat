from sqlalchemy import text, select, and_
from sqlalchemy.orm import aliased
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import Chats, ChatParticipants

load_user_chats_with_last_msg_id_query = """
SELECT 
    cp1.chat_id, 
    u.user_id AS another_user_id,
    u.first_name, 
    u.last_name,
    cm.from_user_id,
    cm.message_text, 
    cm.created_at AS last_message_time
FROM chat_participants cp1
INNER JOIN chat_participants cp2 
    ON cp1.chat_id = cp2.chat_id AND cp1.user_id != cp2.user_id
INNER JOIN users_inf u 
    ON u.user_id = cp2.user_id
LEFT JOIN chats_messages cm 
    ON cm.message_id = cp1.last_message_id 
WHERE cp1.user_id = :user_id
ORDER BY cm.created_at DESC;
"""


async def load_user_chats_with_last_msg_id(db: AsyncSession, current_user_id: int):
    """
    :param db: AsyncSession
    :param current_user_id: int
    :return:
    [
        {
            "chat_id": 1,
            "another_user_id": 5,
            "first_name": "Ahmed",
            "last_name": "Ali",
            "from_user_id": 1,
            "message_text": "Hello bro",
            "last_message_time": "2026-05-03 10:00:00"
        },
        ...
    ]
    """
    query = text(load_user_chats_with_last_msg_id_query)
    result = await db.execute(query, {"user_id": current_user_id})
    chats = result.mappings().all() # --> output dict

    if not chats:
        return []

    return chats

async def load_user_chats(db: AsyncSession, current_user_id: int):
    cp1 = aliased(ChatParticipants)
    cp2 = aliased(ChatParticipants)
    query = (
        select(cp2.user_id)
        .select_from(cp1)
        .join(
            cp2,
            and_(
            cp1.chat_id == cp2.chat_id,
            cp1.user_id != cp2.user_id
            )
        )
        .where(cp1.user_id == current_user_id)
    )
    result = await db.execute(query)
    return result.scalars().all()

async def check_user_in_chat(db: AsyncSession, user_id, chat_id: int):
    query = select(ChatParticipants).where(
        ChatParticipants.user_id == user_id,
        ChatParticipants.chat_id == chat_id
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_other_user_from_chat(db: AsyncSession, user_id, chat_id: int):
    query = select(ChatParticipants).where(
        ChatParticipants.user_id != user_id,
        ChatParticipants.chat_id == chat_id
    )
    result = await db.execute(query)

    return result.scalar_one_or_none()

async def check_2_users_in_chat(db: AsyncSession, user_id1, user_id2):
    cp1 = aliased(ChatParticipants)
    cp2 = aliased(ChatParticipants)
    query = (
        select(cp1.chat_id)
        .select_from(cp1)
        .join(cp2, cp1.chat_id == cp2.chat_id)
        .where(
            cp1.user_id == user_id1,
            cp2.user_id == user_id2
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_two_users_chat(db: AsyncSession, user_id1, user_id2) -> int:
    chat = Chats()
    db.add(chat)

    await db.flush()

    chat_id = chat.chat_id

    user_1 = ChatParticipants(chat_id=chat_id, user_id=user_id1)
    user_2 = ChatParticipants(chat_id=chat_id, user_id=user_id2)

    db.add(user_1)
    db.add(user_2)
    await db.commit()
    await db.refresh(chat)
    return chat.chat_id
