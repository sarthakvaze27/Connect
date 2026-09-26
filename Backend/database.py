import os

import motor.motor_asyncio

MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("MONGO_DB_NAME", "Connect")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
db = client[DATABASE_NAME]


async def create_indexes():
    try:
        await db.users.create_index([("location", "2dsphere")])
        try:
            await db.users.drop_index("referral_code_1")
            print("Dropped existing referral_code_1 index")
        except Exception:
            pass
        await db.users.create_index("referral_code", unique=True, sparse=True)
        await db.users.create_index("email", unique=True)
        await db.users.create_index("profession")
        print("All indexes created successfully")
    except Exception as exc:
        print(f"Index creation error: {exc}")
        if "duplicate key" not in str(exc).lower():
            raise
