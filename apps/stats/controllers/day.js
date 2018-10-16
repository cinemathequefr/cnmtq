const _ = require("lodash");
const moment = require("moment");
const dbSeances = require("../services/db")("seances");
const config = require("../config");
const tarifCat = require("../lib/tarifCat");
const extendDataForViews = require("../lib/extendDataForViews");
const seances = require("../lib/seances");

module.exports = async function(ctx, next) {
  var queryDate;
  var data;

  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }

  // Sans paramètre de date, on redirige vers la dernière date disponible (TODO: prendre en compte le cas où `ctx.query.date` est invalide)
  if (!ctx.query.date) {
    ctx.status = 301;
    return ctx.redirect(`day?date=${lastAvailableDate()}`);
  }

  try {
    queryDate = ctx.query.date;
    data = seances(dbSeances, queryDate, queryDate); // Obtient les données pour la date queryDate
    data = _(data)
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

    data = _({})
      .assign(extendDataForViews(data), { date: queryDate })
      .value();

    ctx.type = "text/html; charset=utf-8";
    return ctx.render("day", data);
  } catch (e) {
    console.log(e);
  }
};

function lastAvailableDate() {
  return dbSeances
    .map(d => d.date)
    .max()
    .value()
    .substring(0, 10); // TODO: validation du paramètre
}
