const jsonwebtoken = require("jsonwebtoken");
const { userDb } = require("../db");
const { secret } = require("../config");

module.exports = {
  login: async (params, req) => {
    let res;
    let email = req.email;
    let password = req.password;

    try {
      if (!email || !password) throw "Bad request"; // Missing paremeter(s)
      res = await userDb.login(email, password);
      console.log(res);
      return {
        username: res.username,
        token: jsonwebtoken.sign(
          {
            data: res,
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
          secret
        ),
      };
    } catch (e) {
      throw e;
    }
  },
  register: async (params, req) => {
    let username = req.username;
    let email = req.email;
    let password = req.password;
    let authlevel = req.authlevel || 1;
    try {
      if (!username || !email || !password || !authlevel) throw "Bad request";

      await userDb.register(username, email, password, authlevel);
      return "User created";
    } catch (e) {
      throw e;
    }
  },
};
