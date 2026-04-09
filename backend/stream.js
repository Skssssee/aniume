const { client } = require('./telegram');
const Anime = require('./models/Anime');
const { Api } = require('telegram');
const mongoose = require('mongoose');

// Jisshu-style streaming: raw invoke with math-aligned offsets
// Based on: https://github.com/Jisshubot/Jisshu-filter-bot/blob/main/Jisshu/util/custom_dl.py
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks (same as Jisshu)

async function* yieldFile(document, offset, firstPartCut, lastPartCut, partCount) {
    let currentPart = 1;

    const location = new Api.InputDocumentFileLocation({
        id: document.id,
        accessHash: document.accessHash,
        fileReference: document.fileReference,
        thumbSize: '',
    });

    while (currentPart <= partCount) {
        const result = await client.invoke(
            new Api.upload.GetFile({
                location,
                offset: offset,
                limit: CHUNK_SIZE,
                precise: true,
            })
        );

        if (!result || !result.bytes || result.bytes.length === 0) break;

        const chunk = result.bytes;

        if (partCount === 1) {
            // Only one chunk: trim both start and end
            yield chunk.slice(firstPartCut, lastPartCut);
        } else if (currentPart === 1) {
            // First chunk: trim the start
            yield chunk.slice(firstPartCut);
        } else if (currentPart === partCount) {
            // Last chunk: trim the end
            yield chunk.slice(0, lastPartCut);
        } else {
            yield chunk;
        }

        currentPart++;
        offset = offset + CHUNK_SIZE;
    }
}

const streamFile = async (req, res, episode_id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(episode_id)) {
        return res.status(400).send('Invalid Episode ID format.');
    }

    const anime = await Anime.findOne({ 'episodes._id': episode_id }, { 'episodes.$': 1 });
    if (!anime || !anime.episodes[0]) {
        return res.status(404).send('Episode not found');
    }

    const episode = anime.episodes[0];
    const { chat_id, message_id } = episode;

    if (!chat_id || !message_id) {
        return res.status(400).send('Episode not indexed with MTProto metadata. Please re-index.');
    }

    // Fetch the message from Telegram to get the document
    const messages = await client.getMessages(chat_id, { ids: [parseInt(message_id)] });
    if (!messages || messages.length === 0 || !messages[0].media) {
        return res.status(404).send('Media not found on Telegram');
    }

    const document = messages[0].media.document;
    if (!document) return res.status(404).send('No document found in message');

    const fileSize = Number(document.size);
    let mimeType = document.mimeType || 'video/mp4';

    // Map MKV to a browser-compatible MIME type
    if (mimeType === 'video/x-matroska') {
        mimeType = 'video/webm';
    }

    const rangeHeader = req.headers.range;

    // Parse the Range header exactly like Jisshu does
    let fromBytes, untilBytes;
    if (rangeHeader) {
        const parts = rangeHeader.replace('bytes=', '').split('-');
        fromBytes = parseInt(parts[0], 10);
        untilBytes = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    } else {
        fromBytes = 0;
        untilBytes = fileSize - 1;
    }

    // Clamp values
    untilBytes = Math.min(untilBytes, fileSize - 1);

    if (untilBytes < fromBytes) {
        return res.status(416).set('Content-Range', `bytes */${fileSize}`).send('Range Not Satisfiable');
    }

    const reqLength = untilBytes - fromBytes + 1;

    // Jisshu's math for aligned offset and part trimming
    const offset = fromBytes - (fromBytes % CHUNK_SIZE);
    const firstPartCut = fromBytes - offset;
    const lastPartCut = (untilBytes % CHUNK_SIZE) + 1;
    const partCount = Math.ceil(untilBytes / CHUNK_SIZE) - Math.floor(offset / CHUNK_SIZE);

    console.log(`Streaming: bytes ${fromBytes}-${untilBytes}/${fileSize} | parts=${partCount} offset=${offset} | ${episode.title}`);

    res.writeHead(rangeHeader ? 206 : 200, {
        'Content-Type': mimeType,
        'Content-Range': `bytes ${fromBytes}-${untilBytes}/${fileSize}`,
        'Content-Length': reqLength,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
    });

    for await (const chunk of yieldFile(document, offset, firstPartCut, lastPartCut, partCount)) {
        if (res.writableEnded) break;
        if (!res.write(chunk)) {
            await new Promise((resolve) => res.once('drain', resolve));
        }
    }

    if (!res.writableEnded) res.end();

  } catch (err) {
    console.error('Streaming error:', err.message);
    if (!res.headersSent) {
        res.status(500).send('Streaming error: ' + err.message);
    }
  }
};

module.exports = { streamFile };
