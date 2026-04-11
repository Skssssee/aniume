import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def test_connection():
    uri = "mongodb+srv://rajmanikumari741_db_user:ysAH1jUEwL6Ek315@rajmmamn.xevowds.mongodb.net/?appName=rajmmamn"
    print(f"Testing connection to: {uri}")
    try:
        client = AsyncIOMotorClient(uri)
        # Force a connection check
        await client.admin.command('ping')
        print("OK: MongoDB Connection Successful!")
        
        db_names = await client.list_database_names()
        print(f"Databases found: {db_names}")
        
    except Exception as e:
        print(f"ERROR: MongoDB Connection Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_connection())
