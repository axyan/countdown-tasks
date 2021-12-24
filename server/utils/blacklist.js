const redisClient = require('../config/cache');

exports.add = (key, expiration) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Set 0 as all keys' value to minimize memory consumption
      // Set EXAT to expire entry at token expiration
      await redisClient.set(key, 0, { EXAT: expiration });
      resolve({ key, expiration });
    } catch (err) {
      reject(err);
    }
  });
};

exports.exists = (key) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Data returned if key exists in blacklist
      const data = await redisClient.get(key);
      data !== null ? resolve(true) : resolve(false);
    } catch (err) {
      reject(err);
    }
  });
};
