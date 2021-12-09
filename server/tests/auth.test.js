const request = require('supertest');
const bcrypt = require('bcryptjs');

const app = require('./app.js');
const mongoTestServer = require('./mongoTestServer');
const User = require('../models/user');
const Blacklist = require('../models/blacklist');

/** Test GET for '/api/session/user' **/
describe('GET /api/session/user Test Suite', () => {

  let token;

  beforeAll(async () => {
    await mongoTestServer.initialize();

    // Register user
    new User({
      email: 'picklerick@c137.com',
      password: await bcrypt.hash('vindicators', 10)
    }).save((err) => {
      if (err) { throw err }
    });

    // Login and save cookie with JWT token
    const response = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({
        email: 'picklerick@c137.com',
        password: 'vindicators'
      });
    token = response.header['set-cookie'][0].split(';',1)[0];
  });

  afterAll(async () => await mongoTestServer.terminate());

  test('valid JWT should return user id', async () => {
    const res = await request(app)
      .get('/api/session/user')
      .set('Accept', 'application/json')
      .set('Cookie', [token])
      .send()
      .expect(200);

    const decodedJWT = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    expect(res.body.success).toBeTruthy();
    expect(res.body.id).toMatch(decodedJWT.id);
  });

  test('request without JWT should return an error', async () => {
    const res = await request(app)
      .get('/api/session/user')
      .set('Accept', 'application/json')
      .send()
      .expect(401);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBeDefined();
  });

  test('blacklisted JWT should return error', async () => {
    // Log out user to blacklist JWT
    await request(app)
      .delete('/api/session')
      .set('Accept', 'application/json')
      .set('Cookie', [token])
      .send()

    const res = await request(app)
      .get('/api/session/user')
      .set('Accept', 'application/json')
      .set('Cookie', [token])
      .send()
      .expect(401);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBeDefined();
  });
});

/** Test POST for '/api/session' **/
describe('POST /api/session Test Suite', () => {

  beforeAll(async () => {
    await mongoTestServer.initialize();

    new User({
      email: 'picklerick@c137.com',
      password: await bcrypt.hash('vindicators', 10)
    }).save((err) => {
      if (err) { throw err }
    });

    new User({
      email: 'evilmorty@c137.com',
      password: await bcrypt.hash('jessica', 10)
    }).save((err) => {
      if (err) { throw err }
    });
  });

  afterAll(async () => await mongoTestServer.terminate());

  test('successful session should return a JSON web token cookie', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({
        email: 'picklerick@c137.com',
        password: 'vindicators'
      })
      .expect(200);

    expect(res.body.success).toBeTruthy();
    expect(res.header['set-cookie']).toBeDefined();
  });

  test('email does not exist should return generic error', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({
        email: 'picklerick2104982034@c137.com',
        password: 'vindicators'
      })
      .expect(200);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch('Invalid email or password');
    expect(res.header['set-cookie']).toBeUndefined();
  });

  test('invalid email format should return error', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({
        email: 'picklerickatc137.com',
        password: 'vindicators'
      })
      .expect(200);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch('Invalid email format');
    expect(res.header['set-cookie']).toBeUndefined();
  });


  test('empty email should return error', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({
        email: '',
        password: 'vindicators'
      })
      .expect(200);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch('Email is required');
    expect(res.header['set-cookie']).toBeUndefined();
  });

  test('incorrect password should return generic error', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({
        email: 'picklerick@c137.com',
        password: 'password'
      })
      .expect(200);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch('Invalid email or password');
    expect(res.header['set-cookie']).toBeUndefined();
  });

  test('empty password should return error', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({
        email: 'picklerick@c137.com',
        password: ''
      })
      .expect(200);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch('Password is required');
    expect(res.header['set-cookie']).toBeUndefined();
  });
});

/** Test DELETE for '/api/session' **/
describe('DELETE /api/session Test Suite', () => {

  let token;

  beforeAll(async () => {
    await mongoTestServer.initialize();

    // Register user
    new User({
      email: 'darthvader@starwars.com',
      password: await bcrypt.hash('order66', 10)
    }).save((err) => {
      if (err) { throw err }
    });

    // Login and save cookie with JWT token
    const response = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({
        email: 'darthvader@starwars.com',
        password: 'order66'
      });
    token = response.header['set-cookie'][0].split(';',1)[0];
  });

  afterAll(async () => await mongoTestServer.terminate());

  test('should logout user (invalidate JWT) by blacklisting JWT', async () => {
    const res = await request(app)
      .delete('/api/session')
      .set('Accept', 'application/json')
      .set('Cookie', [token])
      .send()
      .expect(200);

    expect(res.body.success).toBeTruthy();
    const userBlacklisted = await Blacklist.exists({ _id: token.split('=')[1] });
    expect(userBlacklisted).toBeTruthy();
  });

  test('requests with JWT of logged out user should return an error', async () => {
    const res = await request(app)
      .get('/api/session/user')
      .set('Accept', 'application/json')
      .set('Cookie', [token])
      .send()
      .expect(401);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBeDefined();
  });
});

/** Test protected endpoints require valid JWT **/
describe('Protected Endpoints Test Suite', () => {

  beforeAll(async () => {
    await mongoTestServer.initialize();

    new User({
      email: 'chickennoodlesoup@soup.com',
      password: await bcrypt.hash('beef', 10)
    }).save((err) => {
      if (err) { throw err }
    });
  });

  afterAll(async () => await mongoTestServer.terminate());

  test('protected endpoints should return an error when JWT not provided', async () => {

    // Sessions
    const getSessionUser = await request(app).get('/api/session/user').expect(401);
    expect(getSessionUser.body.success).toBeFalsy();
    expect(getSessionUser.body.error).toBeDefined();

    const deleteSession = await request(app).delete('/api/session/').expect(401);
    expect(deleteSession.body.success).toBeFalsy();
    expect(deleteSession.body.error).toBeDefined();

    // Users
    const putUsers = await request(app).put('/api/users/tempid').expect(401);
    expect(putUsers.body.success).toBeFalsy();
    expect(putUsers.body.error).toBeDefined();

    const deleteUsers = await request(app).delete('/api/users/tempid').expect(401);
    expect(deleteUsers.body.success).toBeFalsy();
    expect(deleteUsers.body.error).toBeDefined();

    // Tasks
    const getTasks = await request(app).get('/api/users/tempid/tasks').expect(401);
    expect(getTasks.body.success).toBeFalsy();
    expect(getTasks.body.error).toBeDefined();

    const postTasks = await request(app).post('/api/users/tempid/tasks').expect(401);
    expect(postTasks.body.success).toBeFalsy();
    expect(postTasks.body.error).toBeDefined();

    const putTasks = await request(app).put('/api/users/tempid/tasks/tempid').expect(401);
    expect(putTasks.body.success).toBeFalsy();
    expect(putTasks.body.error).toBeDefined();

    const deleteTasks = await request(app).delete('/api/users/tempid/tasks/tempid').expect(401);
    expect(deleteTasks.body.success).toBeFalsy();
    expect(deleteTasks.body.error).toBeDefined();
  });

  test('request with blacklisted JWT should be rejected by protected endpoint', async () => {

    // Login and save cookie with JWT token
    const response = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({
        email: 'chickennoodlesoup@soup.com',
        password: 'beef'
      });
    const token = response.header['set-cookie'][0].split(';',1)[0];

    // Log out user which blacklists token
    await request(app)
      .delete('/api/session')
      .set('Accept', 'application/json')
      .set('Cookie', [token])
      .send();

    // Send blacklisted JWT
    const res = await request(app)
      .get('/api/session/user')
      .set('Accept', 'application/json')
      .set('Cookie', [token])
      .send()
      .expect(401);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBeDefined();
  });

  test('request with expired JWT should be rejected by protected endpoint', async () => {

    const originalJWTExpiresIn = process.env.JWT_EXPIRES_IN;
    // Expire token upon creation
    process.env.JWT_EXPIRES_IN = 0;

    // Login and save cookie with 'expired' JWT token
    const response = await request(app)
      .post('/api/session')
      .set('Accept', 'application/json')
      .send({
        email: 'chickennoodlesoup@soup.com',
        password: 'beef'
      });
    const token = response.header['set-cookie'][0].split(';',1)[0];

    // Send 'expired' JWT
    const res = await request(app)
      .get('/api/session/user')
      .set('Accept', 'application/json')
      .set('Cookie', [token])
      .send()
      .expect(401);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch('jwt expired');

    process.env.JWT_EXPIRES_IN = originalJWTExpiresIn;
  });
});
