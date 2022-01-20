const express = require("express");
const request = require("supertest");

const app = require("./app.js");
const mongoTestServer = require("./mongoTestServer");
const utils = require("./testUtils");
const User = require("../models/user");

const redisClient = require("../config/cache");
afterAll(async () => {
  await redisClient.flushAll();
  await redisClient.quit();
});

/** Test POST for '/api/users' **/
describe("POST /api/users Test Suite", () => {
  beforeAll(async () => await mongoTestServer.initialize());

  afterAll(async () => await mongoTestServer.terminate());

  test("should register new user successfully", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Accept", "application/json")
      .send({
        email: "darthvader@deathstar.stormtrooper",
        password: "executeorder66",
        confirmPassword: "executeorder66",
      })
      .expect(200);

    expect(res.body.success).toBeTruthy();
  });

  test("should respond with an error if invalid email format", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Accept", "application/json")
      .send({
        email: "darthvader.email@",
        password: "smartpassword",
        confirmPassword: "smartpassword",
      })
      .expect(400);

    expect(res.body.error).toBeDefined();
    expect(res.body.error).toMatch("Invalid email format");
  });

  test("should not respond with an error to end user if email already exists", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Accept", "application/json")
      .send({
        email: "darthvader@deathstar.stormtrooper",
        password: "newpassword",
        confirmPassword: "newpassword",
      })
      .expect(200);

    expect(res.body.success).toBeTruthy();
  });

  test("should respond with an error if password length less than 8", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Accept", "application/json")
      .send({
        email: "luke@deathstar.stormtrooper",
        password: "pass",
        confirmPassword: "pass",
      })
      .expect(400);

    expect(res.body.error).toBeDefined();
    expect(res.body.error).toMatch(
      "Password needs to be between 8 and 64 characters"
    );
  });

  test("should respond with an error if password and confirm password are different", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Accept", "application/json")
      .send({
        email: "c3po@deathstar.stormtrooper",
        password: "birdperson1",
        confirmPassword: "birdperson2",
      })
      .expect(400);

    expect(res.body.error).toBeDefined();
    expect(res.body.error).toMatch("Passwords do not match");
  });
});

/** Test PUT for '/api/users/:userId' **/
describe("PUT /api/users/:userId Test Suite", () => {
  const CURR_CRED = {
    email: "temp@email.com",
    password: "password",
  };

  const NEW_CRED = {
    email: "hello@world.com",
    newPassword: "newpassword123",
  };

  let UPDATE_USER;

  beforeAll(async () => await mongoTestServer.initialize());
  afterAll(async () => await mongoTestServer.terminate());

  beforeEach(async () => {
    UPDATE_USER = await utils.createUserWithJWT(
      app,
      CURR_CRED.email,
      CURR_CRED.password
    );
  });

  afterEach(async () => {
    await User.collection.drop();
  });

  test("should return an error if no token is provided with request", async () => {
    const res = await request(app)
      .put(`/api/users/${UPDATE_USER.id}`)
      .set("Accept", "application/json")
      .send()
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  test("should only update user email", async () => {
    await request(app)
      .put(`/api/users/${UPDATE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${UPDATE_USER.token}`)
      .send({
        email: NEW_CRED.email,
        oldPassword: CURR_CRED.password,
      })
      .expect(200);

    const user = await User.findById(UPDATE_USER.id);
    const isMatch = await utils.comparePassword(
      NEW_CRED.newPassword,
      user.password
    );

    expect(user.email).toMatch(NEW_CRED.email);
    expect(isMatch).toBeFalsy();
  });

  test("should only update user password", async () => {
    await request(app)
      .put(`/api/users/${UPDATE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${UPDATE_USER.token}`)
      .send({
        oldPassword: CURR_CRED.password,
        newPassword: NEW_CRED.newPassword,
        newConfirmPassword: NEW_CRED.newPassword,
      })
      .expect(200);

    const user = await User.findById(UPDATE_USER.id);
    const isMatch = await utils.comparePassword(
      NEW_CRED.newPassword,
      user.password
    );

    expect(user.email).toMatch(CURR_CRED.email);
    expect(isMatch).toBeTruthy();
  });

  test("should update user email and password", async () => {
    await request(app)
      .put(`/api/users/${UPDATE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${UPDATE_USER.token}`)
      .send({
        email: NEW_CRED.email,
        oldPassword: CURR_CRED.password,
        newPassword: NEW_CRED.newPassword,
        newConfirmPassword: NEW_CRED.newPassword,
      })
      .expect(200);

    const user = await User.findById(UPDATE_USER.id);
    const isMatch = await utils.comparePassword(
      NEW_CRED.newPassword,
      user.password
    );

    expect(user.email).toMatch(NEW_CRED.email);
    expect(isMatch).toBeTruthy();
  });

  test("should return an error if invalid email format", async () => {
    const res = await request(app)
      .put(`/api/users/${UPDATE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${UPDATE_USER.token}`)
      .send({
        email: "temp@u",
        oldPassword: CURR_CRED.password,
      })
      .expect(400);

    const user = await User.findById(UPDATE_USER.id);

    expect(res.body.error).toBeDefined();
    expect(user.email).toMatch(CURR_CRED.email);
  });

  test("should return an error if current password not provided", async () => {
    const res = await request(app)
      .put(`/api/users/${UPDATE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${UPDATE_USER.token}`)
      .send({
        email: NEW_CRED.email,
        newPassword: NEW_CRED.newPassword,
        newConfirmPassword: NEW_CRED.newPassword,
      })
      .expect(400);

    const user = await User.findById(UPDATE_USER.id);
    const isMatch = await utils.comparePassword(
      NEW_CRED.newPassword,
      user.password
    );

    expect(res.body.error).toBeDefined();
    expect(user.email).not.toMatch(NEW_CRED.email);
    expect(isMatch).toBeFalsy();
  });

  test("should return an error if new password length is not between 8 and 64 characters", async () => {
    // Make two invalid requests and finally check that database did not change
    const res1 = await request(app)
      .put(`/api/users/${UPDATE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${UPDATE_USER.token}`)
      .send({
        email: NEW_CRED.email,
        oldPassword: CURR_CRED.password,
        newPassword: "a".repeat(7),
        newConfirmPassword: "a".repeat(7),
      })
      .expect(400);

    const res2 = await request(app)
      .put(`/api/users/${UPDATE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${UPDATE_USER.token}`)
      .send({
        email: NEW_CRED.email,
        oldPassword: CURR_CRED.password,
        newPassword: "a".repeat(65),
        newConfirmPassword: "a".repeat(65),
      })
      .expect(400);

    const user = await User.findById(UPDATE_USER.id);
    const isMatch = await utils.comparePassword(
      NEW_CRED.newPassword,
      user.password
    );

    expect(res1.body.error).toBeDefined();
    expect(res2.body.error).toBeDefined();
    expect(user.email).not.toMatch(NEW_CRED.email);
    expect(isMatch).toBeFalsy();
  });

  test("should return an error if new password and confirm password differ", async () => {
    const res = await request(app)
      .put(`/api/users/${UPDATE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${UPDATE_USER.token}`)
      .send({
        email: NEW_CRED.email,
        oldPassword: CURR_CRED.password,
        newPassword: NEW_CRED.newPassword,
        newConfirmPassword: NEW_CRED.newPassword + "abc",
      })
      .expect(400);

    const user = await User.findById(UPDATE_USER.id);
    const isMatch = await utils.comparePassword(
      NEW_CRED.newPassword,
      user.password
    );

    expect(res.body.error).toBeDefined();
    expect(user.email).not.toMatch(NEW_CRED.email);
    expect(isMatch).toBeFalsy();
  });

  test("should return an error if new password is the same as current password", async () => {
    const res = await request(app)
      .put(`/api/users/${UPDATE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${UPDATE_USER.token}`)
      .send({
        email: NEW_CRED.email,
        oldPassword: CURR_CRED.password,
        newPassword: CURR_CRED.password,
        newConfirmPassword: CURR_CRED.password,
      })
      .expect(400);

    const user = await User.findById(UPDATE_USER.id);
    const isMatch = await utils.comparePassword(
      NEW_CRED.newPassword,
      user.password
    );

    expect(res.body.error).toBeDefined();
    expect(user.email).not.toMatch(NEW_CRED.email);
    expect(isMatch).toBeFalsy();
  });
});

/** Test DELETE for '/api/users/:userId' **/
describe("DELETE /api/users/:userId Test Suite", () => {
  let DELETE_USER;

  beforeAll(async () => await mongoTestServer.initialize());

  afterAll(async () => await mongoTestServer.terminate());

  beforeEach(async () => {
    DELETE_USER = await utils.createUserWithJWT(
      app,
      "temp@email.com",
      "password"
    );
  });

  afterEach(async () => {
    await User.collection.drop();
  });

  test("should return an error if no token is provided with request", async () => {
    const res = await request(app)
      .delete(`/api/users/${DELETE_USER.id}`)
      .set("Accept", "application/json")
      .send()
      .expect(401);

    expect(res.body.error).toBeDefined();
  });

  test("should delete user with zero tasks", async () => {
    await request(app)
      .delete(`/api/users/${DELETE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${DELETE_USER.token}`)
      .send()
      .expect(204);

    const user = await User.findById(DELETE_USER.id);

    expect(user).toBeNull();
  });

  test("should delete user after all tasks are deleted", async () => {
    // Populate user tasks with two tasks
    await request(app)
      .post(`/api/users/${DELETE_USER.id}/tasks`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${DELETE_USER.token}`)
      .send({
        name: "Task #1",
        due: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      })
      .expect(201);

    await request(app)
      .post(`/api/users/${DELETE_USER.id}/tasks`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${DELETE_USER.token}`)
      .send({
        name: "Task #2",
        due: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      })
      .expect(201);

    await request(app)
      .delete(`/api/users/${DELETE_USER.id}`)
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${DELETE_USER.token}`)
      .send()
      .expect(204);

    const user = await User.findById(DELETE_USER.id);

    expect(user).toBeNull();
  });
});
