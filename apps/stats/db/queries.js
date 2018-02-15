const _ = require("lodash");
const db = require("../services/db");

module.exports = {
  day: function (date) { // Data segment: day
    console.log(db.last().value());
    return db.filter(d => {
      return d.date.substring(0, 10) === date;
    })
    .value();
  },
  lastDate: () => db.map(d => d.date).max().value().substring(0, 10) // Last date available for the data
};