const moment = require("moment");
const _ = require("lodash");
const format = require("number-format.js");
const consolidate = require("consolidate");
const db = require("../services/db")("seances");
const mail = require("../services/mail");
const config = require("../config");
const tarifCat = require("../lib/tarifCat");
const extendDataForViews = require("../lib/extendDataForViews");

/**
 * daily
 * Composition et envoi par mail du rapport quotidien de fréquentation
 * @param queryDate { String } YYYY-MM-DD. Par défaut, date courante.
 * @return { Promise }
 */
async function daily(queryDate) {
  var data;
  var html;

  /*
  queryDate =
    queryDate ||
    db
      .map(d => d.date)
      .max()
      .value()
      .substring(0, 10);
  */

  queryDate = moment();

  data = db
    .filter(d => {
      return d.date.substring(0, 10) === queryDate;
    })
    .map(d =>
      _({})
        .assign(d, {
          salle: _(d.salle)
            .assign({ capacity: config.capacity[d.salle.id] })
            .value(),
          tickets: _(d.tickets)
            .assign({ tarifCat: tarifCat(d.tickets.tarif, config.tarifCats) })
            .value()
        })
        .value()
    )
    .value();

  if (data.length === 0) {
    console.log(`${moment().format()} : Aucune séance trouvée pour ce jour : envoi annulé.`);
    return;
  } 

  data = _({})
    .assign(extendDataForViews(data), { date: queryDate })
    .value();

  return new Promise(async function(resolve, reject) {
    try {
      html = await consolidate.lodash(
        __dirname + "/../views/mail-html-day.html",
        data
      );

      await mail.send(
        `Fréquentation en salles du ${_.lowerCase(
          moment(queryDate).format("dddd D MMMM YYYY")
        )} : ${_(data.data).sumBy(d => d.tickets.compte)} spectateurs`,
        "", // TODO: Version texte
        html,
        config.mail.recipients // TODO: passer en paramètre de la fonction
      );

      console.log(`${moment().format()} : Mail envoyé.`);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  daily: daily
};