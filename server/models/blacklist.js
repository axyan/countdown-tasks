const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// 'expireAt' used by MongoDB to automatically remove document which clears
// up our blacklist of expired tokens to keep list small
const blacklistSchema = new Schema({
  _id: { type: String, required: true },
  expireAt: {
    type: Date,
    default: Date.now + 60 * 60 * 1000,
    required: true,
    expires: 0
  }
});

module.exports = mongoose.model('Blacklist', blacklistSchema);
