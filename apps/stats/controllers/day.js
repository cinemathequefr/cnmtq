const _ = require("lodash");
const moment = require("moment");
const dbSeances = require("../services/db")("seances");
const config = require("../config");
const tarifCat = require("../lib/tarifCat");
const extendDataForViews = require("../lib/extendDataForViews");

module.exports = async function(ctx, next) {
  var queryDate;
  var data;

  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }

  ctx.type = "text/html; charset=utf-8";

  try {
    queryDate =
      ctx.params.date ||
      dbSeances
        .map(d => d.date)
        .max()
        .value()
        .substring(0, 10); // TODO: validation du paramètre


    // TODO: obtenir les données par lib\seances.js (comme le fait controller\progression.js)
    data = dbSeances
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

    data = _({})
      .assign(extendDataForViews(data), { date: queryDate })
      .value();

    return ctx.render("day", data);
  } catch (e) {
    console.log(e);
  }
};