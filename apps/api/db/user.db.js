// const _ = require("lodash");
const bcrypt = require("bcrypt");
const db = require("./db-conn");

module.exports = {
  login: async (email, password) => {
    let user;
    try {
      res = await db.query(
        "SELECT username, email, password, authlevel FROM users WHERE email=$1;",
        [email]
      );

      if (res.rowCount === 0) throw "Login error: user not found";
      if ((await bcrypt.compare(password, res.rows[0].password)) === false)
        throw "Login error: invalid password";

      user = res.rows[0];
      return {
        username: user.username,
        email: user.email,
        authlevel: user.authlevel,
      };
    } catch (e) {
      throw e;
    }
  },
  register: async (username, email, password, authlevel) => {
    try {
      res = await db.query(
        "INSERT INTO users(username, email, password, authlevel) VALUES ($1, $2, $3, $4);",
        [username, email, bcrypt.hashSync(password, 10), authlevel] // TODO, IMPORTANT: use async hashing
      );
      if (res.rowCount === 0) throw "Unexpected error"; // Should not happen
      return res;
    } catch (e) {
      throw e;
    }
  },
};
