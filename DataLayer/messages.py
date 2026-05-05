from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import ChatsMessages, ChatParticipants

async def send_message(db: AsyncSession, chat_id: int, from_user_id: int, message_text: str):
    msg: ChatsMessages = ChatsMessages(chat_id=chat_id, from_user_id=from_user_id, message_text=message_text)
    db.add(msg)
    await db.flush()
    stmt = (
        update(ChatParticipants)
        .where(ChatParticipants.chat_id == chat_id)
        .values(last_message_id=msg.message_id)
    )
    await db.execute(stmt)
    await db.commit()
    await db.refresh(msg)
    return msg

async def load_chat_messages(db: AsyncSession, chat_id: int, from_datetime: str):
    query = (
        select(ChatsMessages)
        .where(ChatsMessages.chat_id == chat_id,
               ChatsMessages.created_at < from_datetime)
        .order_by(ChatsMessages.created_at.desc())
        .limit(100)
    )
    result = await db.execute(query)
    return result.scalars().all() # --> output dict
