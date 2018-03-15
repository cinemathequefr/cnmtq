const moment = require("moment");
const _ = require("lodash");
const format = require("number-format.js");
const consolidate = require("consolidate");
const mail = require("../services/mail");
const queries = require("../db/queries");
const config = require("../config");
const utils = require("../utils");


/**
 * daily
 * @param queryDate { String } YYYY-MM-DD. Par défaut, cherche la date de données séances la plus récente.
 * @return { Promise }
 */
async function daily (queryDate) {
  queryDate = queryDate || queries.lastDate();
  var data = queries.day(queryDate);
  var html;
  return new Promise(async function (resolve, reject) {

    try {
      html = await consolidate.lodash(
        __dirname + "/../views/mail-html-day.html",
        {
          date: queryDate,
          moment: moment,
          format: format,
          data: _(data)
          // .reject({ exclude: true }) // TODO: en principe, inutile.
          .map(d =>
            _(d).assign({
              tickets: _(d.tickets).assign({ tarifCat2: utils.tarifCat(d.tickets.tarif, config.tarifCats) }).value()
            })
            .value())
          .value()
        }
      );

      await mail.send(
        `Fréquentation en salles du ${ moment(queryDate).format("dddd D MMMM YYYY") }`,
        "",
        html,
        config.recipients
      );

      resolve();
    } catch (e) {
      reject(e);
    }

  });
};





module.exports = {
  daily: daily
};