from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv
import os
from urllib.parse import quote_plus

load_dotenv()

database_host = os.getenv("DATA_BASE_HOST")
database_name = os.getenv("DATA_BASE_NAME")
database_user = os.getenv("DATA_BASE_USER")
database_pass = quote_plus(os.getenv("DATA_BASE_PASS"))  # quote_plus to solve pass can with not supported symbols

# mmm.. think into it as a sqlalchemy manager of sessions, query texts
# and the aiomysql is the driver that it used to call the db server

DATABASE_URL = f"mysql+aiomysql://{database_user}:{database_pass}@{database_host}/{database_name}"
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # don't return into terminal as a view result
    pool_size=5,  # number of sessions work by default
    max_overflow=10, # mmm.. if the pool_size exists and need more .. u have additional 10 sessions .. total 15 sessions
    pool_recycle=3600  # restart the connection of sessions to avoid timeout of sessions from mysql
)

# to create our sessions pool :)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# the place of our tables models "tables schema" .. we can create the db "after add the schema"
# here from Base.metadata.create_all
Base = declarative_base()

# why this function ..?
# actually we use it to give every user come into our fast api server a session from pool
# and check if the session close and return to pool again to avoid max_overflow 15 in our case
# u ask about yield and why noy return ..? mmm..
# yield is like give us the session and pause until we give it the session again to close it :)
# if we make return we just lose our sessions :) --> no sessions in the pool ..
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
