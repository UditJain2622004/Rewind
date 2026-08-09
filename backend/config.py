import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://cluster0.aqwbqqd.mongodb.net/")
DB_NAME = os.getenv("DB_NAME", "rewind_db")

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")
