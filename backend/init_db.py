import asyncio
from app.core.database import engine, Base, AsyncSessionLocal
from app.api.seed_data import seed_database

async def init_and_seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        await seed_database(session)
    print("Database created and seeded successfully!")

if __name__ == "__main__":
    asyncio.run(init_and_seed())
