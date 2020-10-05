const low = require("lowdb"); // https://github.com/typicode/lowdb
const FileSync = require("lowdb/adapters/FileSync");

var instances = {};

module.exports = dataSource => {
  if (!instances[dataSource]) {
    instances[dataSource] = low(
      new FileSync(`${__dirname}/../../data/${dataSource}.json`)
    );
  }
  return instances[dataSource];
};
