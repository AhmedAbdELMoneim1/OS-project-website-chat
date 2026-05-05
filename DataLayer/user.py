from sqlalchemy import update, select
from sqlalchemy.ext.asyncio import AsyncSession
from core.models import UserINF, UserLoginINF, UserStatus
from datetime import datetime
from typing import Literal

async def create_user(db: AsyncSession, first_name: str, last_name: str, email: str, password_hash: str):
    new_user: UserINF = UserINF(first_name=first_name, last_name=last_name, date_created=datetime.today().date())
    db.add(new_user)
    await db.flush() # we make flush to get user_id and avoid "Inconsistent State" ... check both insert successfully saved ...
    new_user_login_inf = UserLoginINF(user_id=new_user.user_id, email=email, password_hash=password_hash)
    new_user_state_inf = UserStatus(user_id=new_user.user_id, state='offline')
    db.add(new_user_state_inf)
    db.add(new_user_login_inf)
    await db.commit()
    await db.refresh(new_user_login_inf)
    return new_user

async def change_user_pass(db: AsyncSession, user_id: int, password_hash: str):
    # Statement
    stmt = update(UserLoginINF).where(UserLoginINF.user_id == user_id).values(password_hash=password_hash)
    result = await db.execute(stmt)
    await db.commit()
    if result.rowcount == 0:
        return False
    return True

async def change_user_status(db: AsyncSession, user_id: int, state: Literal['online', 'offline']):
    stmt = update(UserStatus).where(UserStatus.user_id == user_id).values(state=state)
    result = await db.execute(stmt)
    await db.commit()
    if result.rowcount == 0:
        return False
    return True

async def check_user_id_exist(db: AsyncSession, user_id: int):
    query = select(UserINF).where(UserINF.user_id == user_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()

async def get_user_full_inf(db: AsyncSession, user_id: int):
    query = (
        select(
            UserINF.user_id,
            UserINF.first_name,
            UserINF.last_name,
            UserLoginINF.email
        )
        .select_from(UserINF)
        .join(UserLoginINF, UserLoginINF.user_id == UserINF.user_id)
        .where(UserINF.user_id == user_id)
    )
    result = await db.execute(query)
    return result.mappings().one_or_none()
