const request = require("supertest");
const bcrypt = require("bcryptjs");
const CryptoJS = require("crypto-js");

const User = require("../models/user");
const Task = require("../models/task");

exports.decodeJWT = (token) => {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
};

exports.createUserWithJWT = async (app, email, password) => {
  try {
    const user = new User({
      email: email,
      password: await bcrypt.hash(password, 10),
    });
    const savedUser = await user.save();

    const res = await request(app)
      .post("/api/session")
      .set("Accept", "application/json")
      .send({ email, password });

    const bytes = CryptoJS.AES.decrypt(
      res.body.token,
      process.env.CRYPTOJS_SECRET
    );
    const token = bytes.toString(CryptoJS.enc.Utf8);

    return { id: savedUser._id.toString(), email, password, token };
  } catch (e) {
    throw e;
  }
};

exports.createUser = async (email, password) => {
  try {
    const user = new User({
      email: email,
      password: await bcrypt.hash(password, 10),
    });
    const savedUser = await user.save();

    return { id: savedUser._id.toString(), email, password };
  } catch (e) {
    throw e;
  }
};

exports.createTask = async (userId, name, due) => {
  try {
    const task = new Task({ name, due });
    const savedTask = await task.save();

    const user = await User.findById(userId).exec();
    user.tasks.push(task);
    await user.save();

    return { id: savedTask._id.toString(), name, due };
  } catch (e) {
    throw e;
  }
};

exports.comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
