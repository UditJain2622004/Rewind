import logging
import base64
import cloudinary
import cloudinary.uploader
import config

logger = logging.getLogger("cloudinary_service")

# Configure Cloudinary if keys are provided
if config.CLOUDINARY_CLOUD_NAME and config.CLOUDINARY_API_KEY and config.CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=config.CLOUDINARY_CLOUD_NAME,
        api_key=config.CLOUDINARY_API_KEY,
        api_secret=config.CLOUDINARY_API_SECRET,
        secure=True
    )
    logger.info("Cloudinary SDK configured successfully.")
else:
    logger.info("Cloudinary keys missing — running in safe fallback preview mode.")

import re
import datetime

def upload_file_to_cloudinary(file_bytes: bytes, filename: str, content_type: str) -> dict:
    resource_type = "auto"
    if content_type.startswith("image/"):
        resource_type = "image"
    elif content_type.startswith("audio/"):
        resource_type = "video"  # Cloudinary processes audio under video resource type

    if config.CLOUDINARY_CLOUD_NAME and config.CLOUDINARY_API_KEY and config.CLOUDINARY_API_SECRET:
        try:
            logger.info(f"Uploading {filename} to Cloudinary ({resource_type})...")
            base_name = filename.rsplit('.', 1)[0] if '.' in filename else filename
            clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', base_name)
            pub_id = f"rewind_{clean_name}_{int(datetime.datetime.now().timestamp())}"

            response = cloudinary.uploader.upload(
                file_bytes,
                folder="rewind_memories",
                resource_type=resource_type,
                public_id=pub_id
            )
            cdn_url = response.get("secure_url") or response.get("url")
            logger.info(f"Cloudinary upload successful: {cdn_url}")
            return {
                "url": cdn_url,
                "file_url": cdn_url,
                "public_id": response.get("public_id"),
                "format": response.get("format"),
                "bytes": response.get("bytes")
            }
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}")

    # Safe fallback if Cloudinary credentials are not set or upload fails
    b64_data = base64.b64encode(file_bytes).decode('utf-8')
    fallback_url = f"data:{content_type};base64,{b64_data}"
    return {
        "url": fallback_url,
        "file_url": fallback_url,
        "public_id": f"local_{filename}",
        "format": filename.rsplit('.', 1)[-1] if '.' in filename else "bin",
        "bytes": len(file_bytes)
    }

