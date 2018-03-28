const low = require("lowdb"); // https://github.com/typicode/lowdb
const FileSync = require("lowdb/adapters/FileSync");

module.exports = dataSource =>
  low(new FileSync(`${__dirname}/../../data/${dataSource}.json`));