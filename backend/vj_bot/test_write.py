import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import datetime
import sys

async def test_write():
    uri = "mongodb+srv://rajmanikumari741_db_user:ysAH1jUEwL6Ek315@rajmmamn.xevowds.mongodb.net/?appName=rajmmamn"
    db_name = "rajmmamn"
    print(f"Testing WRITE to: {uri} (DB: {db_name})")
    
    try:
        client = AsyncIOMotorClient(uri)
        db = client[db_name]
        collection = db["animes"]
        
        # Simulate an anime insert
        test_doc = {
            "title": "Test Anime",
            "slug": "test-anime-slug-123",
            "description": "Test description",
            "episodes": [],
            "created_at": datetime.datetime.now(),
            "updated_at": datetime.datetime.now()
        }
        
        print("Attempting insert_one...")
        res = await collection.insert_one(test_doc)
        print(f"✅ Insert Successful! ID: {res.inserted_id}")
        
        print("Attempting update_one (add episode)...")
        await collection.update_one(
            {"_id": res.inserted_id},
            {"$push": {"episodes": {"ep": 1, "title": "Ep 1"}}}
        )
        print("✅ Update Successful!")
        
        # Cleanup
        await collection.delete_one({"_id": res.inserted_id})
        print("✅ Cleanup Successful!")
        
    except Exception as e:
        print(f"❌ MongoDB WRITE Failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_write())
