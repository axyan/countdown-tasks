const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { isEmail } = require('validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
    validate: {
      validator: isEmail,
      message: 'Invalid email format'
    }
  },
  password: { type: String, required: true, minLength: 8, maxLength: 64 },
  tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }]
});

// User instance method to compare passwords
userSchema.method('verifyPassword', function (passwordInput, cb) {
  bcrypt.compare(passwordInput, this.password, (err, isMatch) => {
    if (err) { return cb(err); }
    cb(null, isMatch);
  });
});

module.exports = mongoose.model('User', userSchema);
