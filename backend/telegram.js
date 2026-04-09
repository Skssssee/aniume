const { Telegraf } = require('telegraf');
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Anime = require('./models/Anime');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// GramJS Client for large file streaming
const SESSION_FILE = path.join(__dirname, 'session.txt');
let sessionString = "";

if (fs.existsSync(SESSION_FILE)) {
    sessionString = fs.readFileSync(SESSION_FILE, 'utf8');
}

const stringSession = new StringSession(sessionString);
const client = new TelegramClient(stringSession, parseInt(process.env.API_ID), process.env.API_HASH, {
    connectionRetries: 5,
});

async function initTelegramClient() {
    try {
        await client.start({
            botAuthToken: process.env.BOT_TOKEN,
        });
        const savedSession = client.session.save();
        fs.writeFileSync(SESSION_FILE, savedSession);
        console.log("GramJS Client connected as Bot and session saved...");
    } catch (err) {
        console.error("GramJS Init Error:", err.message);
        if (err.message.includes("FLOOD")) {
            console.error("⚠️ CRITICAL: Telegram has temporarily blocked new login requests due to frequent restarts.");
            console.error(`Please wait ${err.seconds} seconds before restarting the server.`);
        }
    }
}

initTelegramClient();

// Helper to get file path from Telegram
const getFilePath = async (file_id) => {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile`, {
        params: { file_id: file_id }
    });
    if (response.data.ok) {
      return response.data.result.file_path;
    }
    return null;
  } catch (err) {
    console.error('Error fetching file path:', err.response?.data || err.message);
    return null;
  }
};

// Logic to auto-save forwarded media (Works for PM, Groups, and Channels)
bot.on(['message', 'channel_post'], async (ctx) => {
  const message = ctx.message || ctx.channelPost;
  if (!message) return;

  const media = message.video || message.document;
  // Check if it's a video file or a document with video mime type
  if (!media || !media.mime_type?.startsWith('video/')) return;

  const caption = message.caption || '';
  const fileName = media.file_name || '';
  let fullText = (caption + ' ' + fileName).trim();
  
  const file_id = media.file_id;

  // 1. CLEANUP: Remove all @mentions (e.g., @AnimeStreamer)
  fullText = fullText.replace(/@\w+/g, '').trim();

  // 2. SEASON/EPISODE EXTRACTION
  // Matches: S01E09, Season 01, Episode 09, Ep 09, etc.
  const seasonMatch = fullText.match(/S(\d+)|Season\s*(\d+)/i);
  const epMatch = fullText.match(/E(\d+)|Episode\s*(\d+)|Ep\s*(\d+)/i);
  
  let seasonNumber = 1;
  let epNumber = 1;

  if (seasonMatch) {
    seasonNumber = parseInt(seasonMatch[1] || seasonMatch[2]);
  }
  if (epMatch) {
    epNumber = parseInt(epMatch[1] || epMatch[2] || epMatch[3]);
  }

  // 3. TITLE EXTRACTION: Remove common tags and markers
  let animeTitle = fullText
    .split(/S\d+E\d+|S\d+|Season\s*\d+|Episode\s*\d+|Ep\s*\d+|1080p|720p|480p|HEVC|x265|WEBRip|Bluray|\.mkv|\.mp4|\.avi/i)[0]
    .replace(/[\[\]\-\(\)]/g, ' ') // Remove brackets and dashes
    .replace(/\s+/g, ' ')          // Collapse multiple spaces
    .trim() || 'Uncategorized';

  // Specific cleanup for cases like "Title.mkv Title"
  animeTitle = animeTitle.split(/\.mkv|\.mp4/i)[0].trim();

  try {
    // 1. Find or create the Anime document using atomic upsert
    const slug = animeTitle.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    // We use findOneAndUpdate with upsert:true to handle concurrent creation safely
    const anime = await Anime.findOneAndUpdate(
        { title: new RegExp(`^${animeTitle}$`, 'i') },
        { 
            $setOnInsert: { 
                title: animeTitle,
                slug: `${slug}-${Math.random().toString(36).substring(7)}`,
                description: `Stream the latest episodes of ${animeTitle}`,
                episodes: []
            } 
        },
        { upsert: true, new: true }
    );

    // 2. Check if episode already exists
    const existingEp = anime.episodes.find(e => e.episode_number === epNumber);
    
    if (!existingEp) {
        // Atomic push to episodes array if it doesn't exist
        await Anime.updateOne(
            { _id: anime._id },
            { 
                $push: { 
                    episodes: {
                        episode_number: epNumber,
                        title: fileName || animeTitle + ' Episode ' + epNumber,
                        file_id: file_id,
                        message_id: message.message_id,
                        chat_id: ctx.chat.id.toString()
                    }
                },
                $set: { updated_at: new Date() }
            }
        );
        try {
            await ctx.reply(`✅ Indexed: ${animeTitle} - Episode ${epNumber}`);
        } catch (replyErr) {
            console.log('Indexed successfully, but could not reply in chat:', replyErr.message);
        }
    } else {
        // REFRESH METADATA: Update existing episode if it was indexed before
        await Anime.updateOne(
            { _id: anime._id, "episodes.episode_number": epNumber },
            { 
                $set: { 
                    "episodes.$.file_id": file_id,
                    "episodes.$.message_id": message.message_id,
                    "episodes.$.chat_id": ctx.chat.id.toString(),
                    updated_at: new Date()
                }
            }
        );
        try {
            await ctx.reply(`🔄 Refreshed Metadata: ${animeTitle} - Episode ${epNumber}`);
        } catch (replyErr) {
            console.log('Refreshed metadata, but could not reply in chat.');
        }
    }
  } catch (err) {
    console.error('Error indexing media:', err.message);
    try {
        await ctx.reply('❌ Error indexing media.');
    } catch (ignore) {}
  }
});

// Added /total command
bot.command('total', async (ctx) => {
    try {
        const count = await Anime.countDocuments();
        const epData = await Anime.aggregate([
            { $unwind: "$episodes" },
            { $count: "totalEpisodes" }
        ]);
        const totalEps = epData[0]?.totalEpisodes || 0;
        ctx.reply(`📊 System Stats:\n- Total Anime: ${count}\n- Total Episodes: ${totalEps}`);
    } catch (err) {
        ctx.reply('❌ Error fetching stats.');
    }
});

bot.launch().then(() => console.log('Telegram Bot started...'));

module.exports = { getFilePath, bot, client };
