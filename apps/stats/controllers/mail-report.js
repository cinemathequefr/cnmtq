const moment = require("moment");
const _ = require("lodash");
const format = require("number-format.js");
const consolidate = require("consolidate");
const db = require("../services/db");
const mail = require("../services/mail");
const config = require("../config");
const tarifCat = require("../helpers/tarifCat");
const extendDataForViews = require("../helpers/extendDataForViews");

/**
 * daily
 * Composition et envoi par mail du rapport quotidien de fréquentation
 * @param queryDate { String } YYYY-MM-DD. Par défaut, cherche la date de données séances la plus récente.
 * @return { Promise }
 */
async function daily (queryDate) {
  var data;
  var html;

  queryDate = queryDate || db.map(d => d.date).max().value().substring(0, 10);

  data = db
    .filter(d => {
      return d.date.substring(0, 10) === queryDate;
    })
    .map(
      d => _({}).assign(d, {
        tickets: _(d.tickets).assign({ tarifCat: tarifCat(d.tickets.tarif, config.tarifCats) }).value()
      })
      .value()
    )
    .value();

  data = _({}).assign(
    extendDataForViews(data),
    { date: queryDate }
  ).value();

  return new Promise(async function (resolve, reject) {
    try {
      html = await consolidate.lodash(__dirname + "/../views/mail-html-day.html", data);

      await mail.send(
        `Fréquentation en salles du ${ _.lowerCase(moment(queryDate).format("dddd D MMMM YYYY")) } : ${ _(data.data).sumBy(d => d.tickets.compte) } spectateurs`,
        "", // TODO: Version texte
        html,
        config.mail.recipients // TODO: passer en paramètre de la fonction
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