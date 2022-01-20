const express = require("express");
const cors = require("cors");
const createError = require("http-errors");
const logger = require("morgan");

const apiRouter = require("./routes/api");

// Cache setup
const redisClient = require("./config/cache");
redisClient.connect();

// Database setup
require("./config/database");

// Passport setup
require("./config/passport");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN_URL,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", apiRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({ error: err.message });
});

module.exports = app;
