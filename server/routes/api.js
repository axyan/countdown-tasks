const express = require("express");
const apiRouter = express.Router();

const authRouter = require("./auth");
const userRouter = require("./user");
const taskRouter = require("./task");

/**
 * API ROUTES
 *
 * URL: /api
 */

apiRouter.use(authRouter);
apiRouter.use(userRouter);
apiRouter.use("/users/:userId", taskRouter);

module.exports = apiRouter;
