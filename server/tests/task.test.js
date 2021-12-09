const request = require('supertest');
const bcrypt = require('bcryptjs');

const app = require('./app.js');
const mongoTestServer = require('./mongoTestServer');
const Task = require('../models/task');
const User = require('../models/user');
const utils = require('./testUtils');

/** Test POST for '/api/users/:userId/tasks' **/
describe('POST /api/users/:userId/tasks Test Suite', () => {

  const NEW_TASK_1 = {
    name: 'Task #1',
    due: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };

  const NEW_TASK_2 = {
    name: 'Task #2',
    due: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };

  let POST_USER;

  beforeAll(async () => {
    await mongoTestServer.initialize();

    POST_USER = await utils.createUserWithJWT(app, 'darthvader@stormtrooper.com', 'executeorder66');
  });

  afterAll(async () => await mongoTestServer.terminate());

  afterEach(async() => {
    if (await Task.collection.countDocuments() > 0) {
      await Task.collection.drop();
    }
  });

  test('should return an error if token is not included with request', async () => {
    const res = await request(app)
      .post(`/api/users/${POST_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .send()
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  test('should create a task successfully', async () => {
    const res = await request(app)
      .post(`/api/users/${POST_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${POST_USER.token}`])
      .send({
        name: NEW_TASK_1.name,
        due: NEW_TASK_1.due
      })
      .expect(201);

    expect(res.body.task).toBeDefined();
    expect(res.body.task.name).toMatch(NEW_TASK_1.name);
    expect(res.body.task.due).toEqual(NEW_TASK_1.due);
  });

  test('should create two tasks successfully', async () => {
    const res1 = await request(app)
      .post(`/api/users/${POST_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${POST_USER.token}`])
      .send({
        name: NEW_TASK_1.name,
        due: NEW_TASK_1.due
      })
      .expect(201);

    expect(res1.body.task).toBeDefined();
    expect(res1.body.task.name).toMatch(NEW_TASK_1.name);
    expect(res1.body.task.due).toEqual(NEW_TASK_1.due);

    const res2 = await request(app)
      .post(`/api/users/${POST_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${POST_USER.token}`])
      .send({
        name: NEW_TASK_2.name,
        due: NEW_TASK_2.due
      })
      .expect(201);

    expect(res2.body.task).toBeDefined();
    expect(res2.body.task.name).toMatch(NEW_TASK_2.name);
    expect(res2.body.task.due).toEqual(NEW_TASK_2.due);
  });

  test('should return an error if task name not provided', async () => {
    const res = await request(app)
      .post(`/api/users/${POST_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${POST_USER.token}`])
      .send({
        name: '',
        due: NEW_TASK_1.due
      })
      .expect(400);

    expect(res.body.task).toBeUndefined();
    expect(res.body.error).toBeDefined();
  });

  test('should return an error if task due not provided', async () => {
    const res = await request(app)
      .post(`/api/users/${POST_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${POST_USER.token}`])
      .send({
        name: NEW_TASK_1.name,
        due: ''
      })
      .expect(400);

    expect(res.body.task).toBeUndefined();
    expect(res.body.error).toBeDefined();
  });

  test('should return an error if task due is not an integer', async () => {
    const res = await request(app)
      .post(`/api/users/${POST_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${POST_USER.token}`])
      .send({
        name: NEW_TASK_1.name,
        due: '34l5j34k'
      })
      .expect(400);

    expect(res.body.task).toBeUndefined();
    expect(res.body.error).toBeDefined();
  });

  test('should return an error if task due is less than zero', async () => {
    const res = await request(app)
      .post(`/api/users/${POST_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${POST_USER.token}`])
      .send({
        name: NEW_TASK_1.name,
        due: -1
      })
      .expect(400);

    expect(res.body.task).toBeUndefined();
    expect(res.body.error).toBeDefined();
  });

  test('should return an error if task due is in the past', async () => {
    const res = await request(app)
      .post(`/api/users/${POST_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${POST_USER.token}`])
      .send({
        name: NEW_TASK_1.name,
        due: Math.floor(Date.now() / 1000) - (24 * 60 * 60)
      })
      .expect(400);

    expect(res.body.task).toBeUndefined();
    expect(res.body.error).toBeDefined();
  });
});

/** Test GET for '/api/users/:userId/tasks' **/
describe('GET /api/users/:userId/tasks Test Suite', () => {

  const NEW_TASK_1 = {
    name: 'Task #1',
    due: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };

  const NEW_TASK_2 = {
    name: 'Task #2',
    due: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };

  let GET_USER;

  beforeAll(async () => await mongoTestServer.initialize());
  afterAll(async () => await mongoTestServer.terminate());

  beforeEach(async () => GET_USER = await utils.createUserWithJWT(app, 'picklerick@c137.com', 'vindicators'));
  afterEach(async() => {
    if (await Task.collection.countDocuments() > 0) {
      await Task.collection.drop();
    }
    await User.collection.drop();
  });

  test('should return an error if token is not included with request', async () => {
    const res = await request(app)
      .get(`/api/users/${GET_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .send()
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  test('should return empty array for new user\'s tasks', async () => {
    const res = await request(app)
      .get(`/api/users/${GET_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${GET_USER.token}`])
      .send()
      .expect(200);

    expect(res.body.tasks.length).toEqual(0);
  });

  test('should return array of tasks', async () => {
    await request(app)
      .post(`/api/users/${GET_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${GET_USER.token}`])
      .send({
        name: NEW_TASK_1.name,
        due: NEW_TASK_1.due
      })
      .expect(201);

    await request(app)
      .post(`/api/users/${GET_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${GET_USER.token}`])
      .send({
        name: NEW_TASK_2.name,
        due: NEW_TASK_2.due
      })
      .expect(201);

    const res = await request(app)
      .get(`/api/users/${GET_USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${GET_USER.token}`])
      .send()
      .expect(200);

    expect(res.body.tasks.length).toEqual(2);
  });
});

/** Test PUT for '/api/users/:userId/tasks' **/
describe('PUT /api/users/:userId/tasks Test Suite', () => {

  const CURR_TASK = {
    name: 'Task #1',
    due: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  };

  const UPDATE_TASK = {
    newName: 'Task #9000',
    newDue: Math.floor(Date.now() / 1000) + (24 * 60 * 60 * 7)
  };

  let USER, PUT_TASK;

  beforeAll(async () => {
    await mongoTestServer.initialize();

    USER = await utils.createUserWithJWT(app, 'chickennoodlesoup@soup.com', 'helloworld');
  });

  afterAll(async () => await mongoTestServer.terminate());

  beforeEach(async () => {
    PUT_TASK = await utils.createTask(app, USER.id, CURR_TASK.name, CURR_TASK.due);
  });

  afterEach(async () => {
    await Task.collection.drop();
  });

  test('should return an error if token is not included with request', async () => {
    const res = await request(app)
      .put(`/api/users/${USER.id}/tasks/${PUT_TASK.id}`)
      .set('Accept', 'application/json')
      .send()
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  test('should update name of task', async () => {
    const res = await request(app)
      .put(`/api/users/${USER.id}/tasks/${PUT_TASK.id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${USER.token}`])
      .send({
        name: UPDATE_TASK.newName
      })
      .expect(200);

    expect(res.body.task).toBeDefined();
    expect(res.body.task.name).toMatch(UPDATE_TASK.newName);
    expect(res.body.task.due).toEqual(CURR_TASK.due);
  });

  test('should update due of task', async () => {
    const res = await request(app)
      .put(`/api/users/${USER.id}/tasks/${PUT_TASK.id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${USER.token}`])
      .send({
        due: UPDATE_TASK.newDue
      })
      .expect(200);

    expect(res.body.task).toBeDefined();
    expect(res.body.task.name).toMatch(CURR_TASK.name);
    expect(res.body.task.due).toEqual(UPDATE_TASK.newDue);
  });

  test('should update name and due of task', async () => {
    const res = await request(app)
      .put(`/api/users/${USER.id}/tasks/${PUT_TASK.id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${USER.token}`])
      .send({
        name: UPDATE_TASK.newName,
        due: UPDATE_TASK.newDue
      })
      .expect(200);

    expect(res.body.task).toBeDefined();
    expect(res.body.task.name).toMatch(UPDATE_TASK.newName);
    expect(res.body.task.due).toEqual(UPDATE_TASK.newDue);
  });

  test('should return an error if task due is not an integer', async () => {
    const res = await request(app)
      .put(`/api/users/${USER.id}/tasks/${PUT_TASK.id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${USER.token}`])
      .send({
        name: UPDATE_TASK.newName,
        due: UPDATE_TASK.newDue.toString() + 'a'
      })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  test('should return an error if task due is less than zero', async () => {
    const res = await request(app)
      .put(`/api/users/${USER.id}/tasks/${PUT_TASK.id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${USER.token}`])
      .send({
        name: UPDATE_TASK.newName,
        due: -1
      })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });

  test('should return an error if task due is in the past', async () => {
    const res = await request(app)
      .put(`/api/users/${USER.id}/tasks/${PUT_TASK.id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${USER.token}`])
      .send({
        name: UPDATE_TASK.newName,
        due: CURR_TASK.due - (24 * 60 * 60)
      })
      .expect(400);

    expect(res.body.error).toBeDefined();
  });
});

/** Test DELETE for '/api/users/:userId/tasks' **/
describe('DELETE /api/users/:userId/tasks Test Suite', () => {

  let USER, DELETE_TASK;

  beforeAll(async () => {
    await mongoTestServer.initialize();

    USER = await utils.createUserWithJWT(app, 'water@ocean.com', 'coralreefs');
  });

  afterAll(async () => await mongoTestServer.terminate());

  beforeEach(async () => {
    DELETE_TASK = await utils.createTask(app, USER.id, 'Task #1', Math.floor(Date.now() / 1000) + (24 * 60 * 60));
  });
  
  afterEach(async() => {
    if (await Task.collection.countDocuments() > 0) {
      await Task.collection.drop();
    }
  });

  test('should return an error if token is not included with request', async () => {
    const res = await request(app)
      .delete(`/api/users/${USER.id}/tasks/${DELETE_TASK.id}`)
      .set('Accept', 'application/json')
      .send()
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  test('should delete one task successfully', async () => {
    // Delete user's only task
    await request(app)
      .delete(`/api/users/${USER.id}/tasks/${DELETE_TASK.id}`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${USER.token}`])
      .expect(204);

    // Check user has no tasks
    const res = await request(app)
      .get(`/api/users/${USER.id}/tasks`)
      .set('Accept', 'application/json')
      .set('Cookie', [`token=${USER.token}`])
      .send()
      .expect(200);

    expect(res.body.tasks.length).toEqual(0);
  });
});
