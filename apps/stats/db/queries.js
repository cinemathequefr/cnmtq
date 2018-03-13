const _ = require("lodash");
const db = require("../services/db");


/**
 * day
 * @param date { String }
 * @return { Collection }
 */
function day (date) {
  return db.filter(d => {
    return d.date.substring(0, 10) === date;
  })
  .value();
}


/**
 * lastDate
 * Date des données les plus récentes dispoibles
 * @return { String } Date au format YYYY-MM-DD
 */
function lastDate () {
  return db.map(d => d.date).max().value().substring(0, 10);
}




module.exports = {
  day: day,
  lastDate: lastDate
};