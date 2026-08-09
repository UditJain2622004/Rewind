import datetime
import logging
from pymongo import MongoClient
import config

logger = logging.getLogger("mongodb_service")

client = None
db = None

def get_db():
    global client, db
    if db is None:
        try:
            logger.info(f"Connecting to MongoDB at {config.MONGODB_URI[:30]}...")
            client = MongoClient(
                config.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                tlsAllowInvalidCertificates=True
            )
            db = client[config.DB_NAME]
            # Test connection
            client.admin.command('ping')
            logger.info("Successfully connected to MongoDB!")
        except Exception as e:
            logger.warning(f"MongoDB connection warning/fallback: {e}")
            db = None
    return db

def save_or_update_draft(draft_data: dict) -> dict:
    database = get_db()
    memory_id = draft_data.get("id") or draft_data.get("memory_id") or f"exp_draft_{int(datetime.datetime.now().timestamp())}"
    
    document = {
        "_id": memory_id,
        "memory_id": memory_id,
        "title": draft_data.get("title") or draft_data.get("name") or "Untitled Memory Story",
        "voice_style": draft_data.get("voice_style", "Warm & Nostalgic"),
        "status": draft_data.get("status", "draft"),
        "items": draft_data.get("items", []),
        "updated_at": datetime.datetime.utcnow().isoformat()
    }

    if database is not None:
        try:
            collection = database["memories"]
            collection.update_one(
                {"_id": memory_id},
                {"$set": document, "$setOnInsert": {"created_at": datetime.datetime.utcnow().isoformat()}},
                upsert=True
            )
            logger.info(f"Draft memory {memory_id} saved to MongoDB.")
        except Exception as e:
            logger.error(f"Error saving to MongoDB: {e}")

    return document

def get_active_draft(memory_id: str = None) -> dict:
    database = get_db()
    if database is not None:
        try:
            collection = database["memories"]
            if memory_id:
                doc = collection.find_one({"_id": memory_id})
            else:
                doc = collection.find_one({"status": "draft"}, sort=[("updated_at", -1)])
            if doc:
                return doc
        except Exception as e:
            logger.error(f"Error fetching draft from MongoDB: {e}")
    return None

def update_memory_status(memory_id: str, new_status: str) -> bool:
    database = get_db()
    if database is not None:
        try:
            collection = database["memories"]
            res = collection.update_one(
                {"_id": memory_id},
                {"$set": {"status": new_status, "updated_at": datetime.datetime.utcnow().isoformat()}}
            )
            return res.modified_count > 0
        except Exception as e:
            logger.error(f"Error updating status in MongoDB: {e}")
    return False

def get_all_memories_from_db() -> list:
    database = get_db()
    memories_list = []
    if database is not None:
        try:
            collection = database["memories"]
            cursor = collection.find({}).sort("updated_at", -1)
            for doc in cursor:
                if "_id" in doc:
                    doc["id"] = str(doc["_id"])
                memories_list.append(doc)
        except Exception as e:
            logger.error(f"Error fetching all memories from MongoDB: {e}")
    return memories_list

