const low = require("lowdb"); // https://github.com/typicode/lowdb
const FileSync = require("lowdb/adapters/FileSync");
const _ = require("lodash");

const adapter = new FileSync(__dirname + "/../data/seances.json");
const db = low(adapter);

module.exports = {
  day: function (date) { // Data segment: day
    return db.filter(d => {
      return d.date.substring(0, 10) === date;
    })
    .value();
  },
  lastDate: () => db.map(d => d.date).max().value().substring(0, 10) // Last date available for the data
};