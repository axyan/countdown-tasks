const jwt = require("jsonwebtoken");

exports.parseAuthHeader = (requestHeader) => {
  const authHeader = requestHeader.authorization;

  let token = null;
  if (authHeader !== undefined && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7, authHeader.length);
  }
  return token;
};

exports.verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, payload) => {
      if (err) {
        reject({ httpErrorCode: 401, message: err.message });
        return;
      }

      resolve(payload);
    });
  });
};
