from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import UserLoginINF

async def check_user(db: AsyncSession, email: str):
    query = select(UserLoginINF).where(UserLoginINF.email == email)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def check_user_pass(db: AsyncSession, email: str, password_hash: str):
    query = select(UserLoginINF).where(UserLoginINF.email == email).where(UserLoginINF.password_hash == password_hash)
    result = await db.execute(query)
    return result.scalar_one_or_none()
