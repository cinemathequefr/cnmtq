const _ = require("lodash");
const moment = require("moment");
const db = require("../services/db")("seances");
const config = require("../config");
const tarifCat = require("../lib/tarifCat");
const extendDataForViews = require("../lib/extendDataForViews");
const seances = require("../lib/seances");

module.exports = async function(ctx, next) {
  // var queryDate; // Mois (yyyy-mm)

  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }

  ctx.type = "text/html; charset=utf-8";

  try {
    var monthTo = moment()
      .startOf("month")
      .subtract(1, "months")
      .endOf("month"); // Mois précédent le mois courant

    var monthFrom = monthTo.clone().startOf("year");

    // Année n
    var data0 = _(seances(db.getState(), monthFrom, monthTo, "month"))
      .map((v, k) => [k, v.global.entrees])
      .sortBy(d => d[0])
      .value();

    // Année n-1
    var data1 = _(
      seances(
        db.getState(),
        monthFrom.clone().subtract(1, "year"),
        monthTo.clone().subtract(1, "year"),
        "month"
      )
    )
      .map((v, k) => [k, v.global.entrees])
      .sortBy(d => d[0])
      .value();

    var data = _([data0, data1])
      .unzip()
      .map(d => _.flatten(d))
      .map(d => {
        d.push((d[1] - d[3]) / d[3]);
        return d;
      })
      .value();

    data = _({})
      .assign(extendDataForViews(data), { monthTo: monthTo })
      .value();

    return ctx.render("progression", data);
  } catch (e) {
    console.log(e);
  }

  /*
  try {
    queryDate =
      ctx.params.date ||
      db
        .map(d => d.date)
        .max()
        .value()
        .substring(0, 10); // TODO: validation du paramètre

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

    data = _({})
      .assign(extendDataForViews(data), { date: queryDate })
      .value();

    return ctx.render("day", data);
  } catch (e) {
    console.log(e);
  }
*/
};
