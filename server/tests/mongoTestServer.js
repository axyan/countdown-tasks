const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const mongoServer = new MongoMemoryServer();

// Starts MongoDB instance in memory
exports.initialize = async () => {
  await mongoServer.start();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error: '));
};

// Shutdown and clean up MongoDB instance in memory
exports.terminate = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};
