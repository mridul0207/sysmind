const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  room: { type: String },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema); 