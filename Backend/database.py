import motor.motor_asyncio
import os

MONGO_DETAILS = "mongodb://localhost:27017"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)

db = client.Connect

async def create_indexes():
    try:
        # Create geospatial index
        await db.users.create_index([("location","2dsphere")])
        
        # Handle referral_code index - drop existing if needed
        try:
            await db.users.drop_index("referral_code_1")
            print("Dropped existing referral_code_1 index")
        except:
            pass
        
        # Create new referral_code index
        await db.users.create_index("referral_code", unique=True, sparse=True)
        
        # Create other indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("profession")
        
        print("All indexes created successfully")
    except Exception as e:
        print(f"Index creation error: {e}")
        # If it's just a duplicate index error, that's okay
        if "duplicate key" not in str(e).lower():
            raise e