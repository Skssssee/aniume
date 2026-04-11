const mongoose = require('mongoose');

const StateSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'last_processed_id'
    value: { type: mongoose.Mixed, required: true },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('State', StateSchema);
