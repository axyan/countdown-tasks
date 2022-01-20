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

/** Test GET for '/api/session/user' **/
describe("GET /api/session/user Test Suite", () => {
  let GET_USER;

  beforeAll(async () => {
    await mongoTestServer.initialize();

    GET_USER = await utils.createUserWithJWT(
      app,
      "picklerick@c137.com",
      "vindicators"
    );
  });

  afterAll(async () => await mongoTestServer.terminate());

  test("valid JWT should return user id", async () => {
    const res = await request(app)
      .get("/api/session/user")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${GET_USER.token}`)
      .send()
      .expect(200);

    const decodedJWT = utils.decodeJWT(GET_USER.token);
    expect(res.body.success).toBeTruthy();
    expect(res.body.id).toMatch(decodedJWT.id);
  });

  test("request without JWT should return an error", async () => {
    const res = await request(app)
      .get("/api/session/user")
      .set("Accept", "application/json")
      .send()
      .expect(401);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBeDefined();
  });

  test("blacklisted JWT should return error", async () => {
    // Log out user to blacklist JWT
    await request(app)
      .delete("/api/session")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${GET_USER.token}`)
      .send();

    const res = await request(app)
      .get("/api/session/user")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${GET_USER.token}`)
      .send()
      .expect(401);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBeDefined();
  });
});

/** Test POST for '/api/session' **/
describe("POST /api/session Test Suite", () => {
  let POST_SESSION_USER;

  beforeAll(async () => {
    await mongoTestServer.initialize();

    POST_SESSION_USER = await utils.createUser(
      "picklerick@c137.com",
      "vindicators"
    );
  });

  afterAll(async () => await mongoTestServer.terminate());

  test("successful session should return an encrypted JWT", async () => {
    const res = await request(app)
      .post("/api/session")
      .set("Accept", "application/json")
      .send({
        email: POST_SESSION_USER.email,
        password: POST_SESSION_USER.password,
      })
      .expect(200);

    expect(res.body.success).toBeTruthy();
    expect(res.body.token).toBeDefined();
  });

  test("email does not exist should return generic error", async () => {
    const res = await request(app)
      .post("/api/session")
      .set("Accept", "application/json")
      .send({
        email: "picklerick2104982034@c137.com",
        password: POST_SESSION_USER.password,
      })
      .expect(200);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch("Invalid email or password");
    expect(res.body.token).toBeUndefined();
  });

  test("invalid email format should return error", async () => {
    const res = await request(app)
      .post("/api/session")
      .set("Accept", "application/json")
      .send({
        email: "picklerickatc137.com",
        password: POST_SESSION_USER.password,
      })
      .expect(200);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch("Invalid email format");
    expect(res.body.token).toBeUndefined();
  });

  test("empty email should return error", async () => {
    const res = await request(app)
      .post("/api/session")
      .set("Accept", "application/json")
      .send({
        email: "",
        password: POST_SESSION_USER.password,
      })
      .expect(200);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch("Email is required");
    expect(res.body.token).toBeUndefined();
  });

  test("incorrect password should return generic error", async () => {
    const res = await request(app)
      .post("/api/session")
      .set("Accept", "application/json")
      .send({
        email: POST_SESSION_USER.email,
        password: POST_SESSION_USER.password + "a",
      })
      .expect(200);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch("Invalid email or password");
    expect(res.body.token).toBeUndefined();
  });

  test("empty password should return error", async () => {
    const res = await request(app)
      .post("/api/session")
      .set("Accept", "application/json")
      .send({
        email: POST_SESSION_USER.email,
        password: "",
      })
      .expect(200);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch("Password is required");
    expect(res.body.token).toBeUndefined();
  });
});

/** Test DELETE for '/api/session' **/
describe("DELETE /api/session Test Suite", () => {
  let DELETE_SESSION_USER;

  beforeAll(async () => {
    await mongoTestServer.initialize();

    DELETE_SESSION_USER = await utils.createUserWithJWT(
      app,
      "darthvader@starwars.com",
      "order66"
    );
  });

  afterAll(async () => await mongoTestServer.terminate());

  test("should logout user (invalidate JWT) by blacklisting JWT", async () => {
    await request(app)
      .delete("/api/session")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${DELETE_SESSION_USER.token}`)
      .send()
      .expect(204);

    const keyValue = await redisClient.get(DELETE_SESSION_USER.token);
    expect(keyValue).toMatch("0"); // Store 0 as value to minimize memory consumption
  });

  test("requests with JWT of logged out user should return an error", async () => {
    const res = await request(app)
      .get("/api/session/user")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${DELETE_SESSION_USER.token}`)
      .send()
      .expect(401);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBeDefined();
  });
});

/** Test protected endpoints require valid JWT **/
describe("Protected Endpoints Test Suite", () => {
  let USER;

  beforeAll(async () => await mongoTestServer.initialize());
  afterAll(async () => await mongoTestServer.terminate());

  afterEach(async () => {
    if ((await User.collection.countDocuments()) > 0) {
      await User.collection.drop();
    }
  });

  test("protected endpoints should return an error when JWT not provided", async () => {
    // Sessions
    const getSessionUser = await request(app)
      .get("/api/session/user")
      .expect(401);
    expect(getSessionUser.body.success).toBeFalsy();
    expect(getSessionUser.body.error).toBeDefined();

    const deleteSession = await request(app)
      .delete("/api/session/")
      .expect(401);
    expect(deleteSession.body.success).toBeFalsy();
    expect(deleteSession.body.error).toBeDefined();

    // Users
    const putUsers = await request(app).put("/api/users/tempid").expect(401);
    expect(putUsers.body.success).toBeFalsy();
    expect(putUsers.body.error).toBeDefined();

    const deleteUsers = await request(app)
      .delete("/api/users/tempid")
      .expect(401);
    expect(deleteUsers.body.success).toBeFalsy();
    expect(deleteUsers.body.error).toBeDefined();

    // Tasks
    const getTasks = await request(app)
      .get("/api/users/tempid/tasks")
      .expect(401);
    expect(getTasks.body.success).toBeFalsy();
    expect(getTasks.body.error).toBeDefined();

    const postTasks = await request(app)
      .post("/api/users/tempid/tasks")
      .expect(401);
    expect(postTasks.body.success).toBeFalsy();
    expect(postTasks.body.error).toBeDefined();

    const putTasks = await request(app)
      .put("/api/users/tempid/tasks/tempid")
      .expect(401);
    expect(putTasks.body.success).toBeFalsy();
    expect(putTasks.body.error).toBeDefined();

    const deleteTasks = await request(app)
      .delete("/api/users/tempid/tasks/tempid")
      .expect(401);
    expect(deleteTasks.body.success).toBeFalsy();
    expect(deleteTasks.body.error).toBeDefined();
  });

  test("request with blacklisted JWT should be rejected by protected endpoint", async () => {
    USER = await utils.createUserWithJWT(
      app,
      "chickennoodle@soup.com",
      "welldonesteak"
    );

    // Log out user which blacklists token
    await request(app)
      .delete("/api/session")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${USER.token}`)
      .send();

    // Send blacklisted JWT
    const res = await request(app)
      .get("/api/session/user")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${USER.token}`)
      .send()
      .expect(401);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toBeDefined();
  });

  test("request with expired JWT should be rejected by protected endpoint", async () => {
    const originalJWTExpiresIn = process.env.JWT_EXPIRES_IN;
    // Expire token upon creation
    process.env.JWT_EXPIRES_IN = 0;

    // Get user with 'expired' JWT token
    USER = await utils.createUserWithJWT(
      app,
      "chickennoodle@soup.com",
      "welldonesteak"
    );

    // Send 'expired' JWT
    const res = await request(app)
      .get("/api/session/user")
      .set("Accept", "application/json")
      .set("Authorization", `Bearer ${USER.token}`)
      .send()
      .expect(401);

    expect(res.body.success).toBeFalsy();
    expect(res.body.error).toMatch("jwt expired");

    process.env.JWT_EXPIRES_IN = originalJWTExpiresIn;
  });
});
