const config = {};

config.secret = "MyLittleSecretIsYou";

config.httpMessage = {
  "Resource deleted": { status: 200 }, // 200 = OK
  "Resource updated": { status: 200 }, // 200 = OK
  "User created": { status: 201 }, // 201 = Created
  "Bad request": { status: 400 }, // 400 = Bad request (e.g. some parameters are missing)
  "Unauthorized request": { status: 401 }, // 401 = Unauthorized
  "Login error: user not found": { status: 403 }, // 403 = Forbidden
  "Login error: invalid password": { status: 403 }, // 403 = Forbidden
  "Resource not found": { status: 404 },
  "Unspecified error": { status: 500 },
};

module.exports = config;
