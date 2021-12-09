const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const blacklistSchema = new Schema({
  _id: { type: String, required: true },
  expiration: { type: Number, required: true }
});

module.exports = mongoose.model('Blacklist', blacklistSchema);
