const { Telegraf, Markup } = require('telegraf');
const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const path = require('path');
const Anime = require('./models/Anime');
const State = require('./models/State');
const { sanitizeName } = require('./utils');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const SESSION_FILE = path.join(__dirname, 'session.txt');
let sessionString = '';
if (fs.existsSync(SESSION_FILE)) sessionString = fs.readFileSync(SESSION_FILE, 'utf8').trim();

const stringSession = new StringSession(sessionString);
const client = new TelegramClient(stringSession, parseInt(process.env.API_ID), process.env.API_HASH, {
    connectionRetries: 10,
    retryDelay: 2000,
    autoReconnect: true,
    floodSleepThreshold: 60,
});

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

const sendEpisodeLog = async (animeTitle, episode, status) => {
    // Legacy helper for server.js backup logs
    const msg = `📺 **${status}: ${animeTitle}**\nEP: ${episode.episode_number}\nTitle: ${episode.title}`;
    try {
        await bot.telegram.sendMessage(process.env.TARGET_CHANNEL_ID, msg).catch(() => null);
    } catch (e) {}
};

// ------------------------------------------------------------------
// STARTUP ENGINE
// ------------------------------------------------------------------

async function run() {
    console.log('🔗 Connecting GramJS (Streaming Engine)...');
    await client.start({ botAuthToken: process.env.BOT_TOKEN });
    
    // WARM UP CACHE: Resolve source and target channels to ensure we have access hashes for streaming
    console.log('🔥 Warming up Streaming Cache...');
    try {
        const source = process.env.SOURCE_CHANNEL_ID || 'uuiijjjjiiyyjj';
        const target = process.env.TARGET_CHANNEL_ID || 'yyuuuuuhny';
        
        await client.getEntity(source).catch(() => null);
        await client.getEntity(target).catch(() => null);
        
        console.log('✅ Streaming Cache Warmed Up.');
    } catch (err) {
        console.warn('⚠️ Cache Warm-up Warning:', err.message);
    }

    // bot.launch(); // DISABLED: MIGRATED TO VJ-BOT-PYTHON
    console.log('🚀 Node.js Streaming Engine Ready (Forwarder Migrated to Python)');
}

run().catch(console.error);

module.exports = { client, sendEpisodeLog };
