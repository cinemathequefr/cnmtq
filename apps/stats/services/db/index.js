const low = require("lowdb"); // https://github.com/typicode/lowdb
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync(__dirname + "/../../data/seances.json");
const db = low(adapter);

module.exports = db;