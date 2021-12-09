const request = require('supertest');
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Task = require('../models/task');

exports.createUser = async (email, password) => {
  try {
    const user = new User({
      email: email,
      password: await bcrypt.hash(password, 10)
    });

    const savedUser = await user.save();
    return savedUser;
  } catch (e) {
    throw e;
  }
};

exports.registerUser = async (app, email, password) => {
  return await request(app)
    .post('/api/users')
    .set('Accept', 'application/json')
    .send({
      email: email,
      password: password,
      confirmPassword: password
    });
};

exports.loginUser = async (app, email, password) => {
  return await request(app)
    .post('/api/session')
    .set('Accept', 'application/json')
    .send({ email, password });
};

exports.getJWTFromResponse = (response) => {
  return response.header['set-cookie'][0].split(';', 1)[0].split('=')[1];
};

exports.decodeJWT = (token) => {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
};

exports.getUserJWT = async (app, email, password) => {
  const res = await request(app)
    .post('/api/session')
    .set('Accept', 'application/json')
    .send({ email, password });

  const token = res.header['set-cookie'][0].split(';', 1)[0].split('=')[1];

  return token;
};

exports.createUserWithJWT = async (app, email, password) => {
  try {
    const user = new User({
      email: email,
      password: await bcrypt.hash(password, 10)
    });
    const savedUser = await user.save();

    const res = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({ email, password });

    const token = res.header['set-cookie'][0].split(';', 1)[0].split('=')[1];

    return { id: savedUser._id.toString(), email, password, token };
  } catch (e) {
    throw e;
  }
};

exports.createTask = async (app, userId, name, due)  => {
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
