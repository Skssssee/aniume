const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
  episode_number: { type: Number, required: true },
  title: { type: String, required: true },
  file_id: { type: String, required: true },
  message_id: { type: Number },
  chat_id: { type: String },
  file_path: { type: String }, // Cached from Telegram
  file_size: { type: Number },
  mime_type: { type: String }
});

const AnimeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  poster: { type: String },
  episodes: [EpisodeSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Case-insensitive search index on title
AnimeSchema.index({ title: 'text' });

module.exports = mongoose.model('Anime', AnimeSchema);
