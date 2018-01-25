const low = require("lowdb"); // https://github.com/typicode/lowdb
const FileSync = require("lowdb/adapters/FileSync");
const _ = require("lodash");

const adapter = new FileSync("./data/seances.json"); // To make it work from server.js
// const adapter = new FileSync("../../data/seances.json"); To make it work from apps/stats/index.js
const db = low(adapter);

module.exports = {
  date: function (date) {
    return db.filter(d => {
      return d.date.substring(0, 10) === date;
    })
    .value();
  }
};