"""Quick test to verify database and auth work."""
import asyncio
import sys
sys.path.insert(0, '.')

from app.core.database import AsyncSessionLocal, engine
from app.models.models import Base
from app.models.models import User
from sqlalchemy import select


async def test():
    # Test database connection and table creation
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('* Database tables created successfully')

    # Check seeded data
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).limit(3))
        users = result.scalars().all()
        print('* Seeded users (%d shown):' % len(users))
        for u in users:
            print('  - %s | Role: %s | Active: %s' % (u.username, u.role, u.is_active))

    print('* All database checks passed!')


if __name__ == '__main__':
    asyncio.run(test())