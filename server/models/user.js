const mongoose = require('mongoose');
const { isEmail } = require('validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    maxLength: 100,
    validate: {
      validator: isEmail,
      message: 'Invalid email format'
    }
  },
  password: { type: String, required: true, maxLength: 100 },
});

// Virtual to get user url
userSchema
  .virtual('url')
  .get(function() {
    return '/users/'+ this._id;
  });

module.exports = mongoose.model('User', userSchema);