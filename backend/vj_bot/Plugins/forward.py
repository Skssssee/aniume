import logging
import asyncio
from pyrogram import filters
from bot import channelforward
from config import Config 
from Plugins.database import process_metadata, index_media

logger = logging.getLogger(__name__)

@channelforward.on_message(filters.chat(Config.SOURCE_CHANNEL))
async def forward_and_index(client, message):
    try:
        # 1. Forward to Target
        func = message.copy if Config.AS_COPY else message.forward
        target_msg = await func(Config.TARGET_CHANNEL)
        
        # 2. Extract Metadata
        metadata = process_metadata(message)
        if metadata:
            # 3. Index in MongoDB
            status = await index_media(message.id, target_msg.id, Config.TARGET_CHANNEL, metadata)
            logger.info(f"Forwarded & Indexed: {metadata['animeTitle']} - {status}")
        else:
            logger.info(f"Forwarded non-video message {message.id}")
            
        await asyncio.sleep(1.5) # Flood protection
    except Exception as e:
        logger.error(f"Forward Error: {e}")
