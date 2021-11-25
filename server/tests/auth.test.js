const express = require('express');
const request = require('supertest');

const app = require('./app.js');
const mongoTestServer = require('./mongoTestServer');
const User = require('../models/user');

/** Test POST to /signup **/
describe('POST /signup Test Suite', () => {

  beforeAll(async () => await mongoTestServer.initialize());

  afterAll(async () => await mongoTestServer.terminate());

  test('register new user successfully', async () => {
    const res = await request(app)
      .post('/signup')
      .set('Accept', 'application/json')
      .send({
        email: 'darthvader@deathstar.stormtrooper',
        password: 'executeorder66',
        confirmPassword: 'executeorder66'
      })
      .expect(200);
  });

  test('invalid email format should respond with an error', async () => {
    const res = await request(app)
      .post('/signup')
      .set('Accept', 'application/json')
      .send({
        email: 'darthvader.email@',
        password: 'smartpassword',
        confirmPassword: 'smartpassword'
      })
      .expect(200);

    expect(res.body.error).toBeDefined();
    expect(res.body.error).toMatch('Invalid email format');
  });

  test('email already exists should not respond with an error to end user', async () => {
    const res = await request(app)
      .post('/signup')
      .set('Accept', 'application/json')
      .send({
        email: 'darthvader@deathstar.stormtrooper',
        password: 'newpassword',
        confirmPassword: 'newpassword'
      })
      .expect(200);
  });

  test('password length less than 8 should respond with an error', async () => {
    const res = await request(app)
      .post('/signup')
      .set('Accept', 'application/json')
      .send({
        email: 'luke@deathstar.stormtrooper',
        password: 'pass',
        confirmPassword: 'pass'
      })
      .expect(200);

    expect(res.body.error).toBeDefined();
    expect(res.body.error).toMatch('Password needs to be between 8 and 64 characters');
  });

  test('different password and confirm password should respond with an error', async () => {
    const res = await request(app)
      .post('/signup')
      .set('Accept', 'application/json')
      .send({
        email: 'c3po@deathstar.stormtrooper',
        password: 'birdperson1',
        confirmPassword: 'birdperson2'
      })
      .expect(200);

    expect(res.body.error).toBeDefined();
    expect(res.body.error).toMatch('Passwords do not match');
  });
});