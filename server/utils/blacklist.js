const redisClient = require("../config/cache");

exports.add = async (key, expiration) => {
  try {
    // Set 0 as all keys' value to minimize memory consumption
    // Set EXAT to expire entry at token expiration
    await redisClient.set(key, 0, { EXAT: expiration });
    return { key, expiration };
  } catch (err) {
    throw err;
  }
};

exports.exists = async (key) => {
  try {
    // Data returned if key exists in blacklist
    const data = await redisClient.get(key);
    return data !== null ? true : false;
  } catch (err) {
    throw err;
  }
};
