const jwt = require('jsonwebtoken');

exports.parseAuthHeader = (requestHeader) => {
  const authHeader = requestHeader.authorization;

  let token = null;
  if (authHeader !== undefined && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7, authHeader.length);
  }
  return token;
};

exports.verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) {
        reject({ httpErrorCode: 401, message: err.message });
        return;
      }

      resolve(payload);
    });
  });
};
