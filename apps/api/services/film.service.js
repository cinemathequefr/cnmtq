const { filmDb } = require("../db");

module.exports = {
  create: async (params, req) => {
    try {
      await filmDb.create(req);
      return "Resource created";
    } catch (e) {
      throw e;
    }
  },
  update: async (params, req) => {
    let id = params.id;
    try {
      await filmDb.update(id, req);
      return "Resource updated";
    } catch (e) {
      throw e;
    }
  },
  getAll: async (params, req) => {
    console.log(params);
    console.log(req);

    let q = req.q;
    try {
      return await filmDb.getAll(q);
    } catch (e) {
      throw e;
    }
  },
  get: async (params, req) => {
    let id = params.id;
    console.log(id);
    try {
      return await filmDb.get(id);
    } catch (e) {
      throw e;
    }
  },
  delete: async (params, req) => {
    let id = params.id;
    try {
      await filmDb.delete(id);
      return "Resource deleted";
    } catch (e) {
      throw e;
    }
  },
};
