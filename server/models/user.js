const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { isEmail } = require("validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100,
    validate: {
      validator: isEmail,
      message: "Invalid email format",
    },
  },
  password: { type: String, required: true, minLength: 8, maxLength: 64 },
  tasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
});

// User instance method to compare passwords
userSchema.method(
  "verifyPassword",
  function (passwordInput, password = this.password) {
    return new Promise(function (resolve, reject) {
      bcrypt.compare(passwordInput, password, (err, isMatch) => {
        if (err) {
          return reject(err);
        }
        resolve(isMatch);
      });
    });
  }
);

module.exports = mongoose.model("User", userSchema);
