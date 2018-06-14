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
    var yoy0 = yoy(0);
    var data0 = _(seances(db.getState(), yoy0.start, yoy0.end, "month"))
      .map((v, k) => [k, v.global.entrees])
      .sortBy(d => d[0])
      .value();

    var yoy1 = yoy(1);
    var data1 = _(seances(db.getState(), yoy1.start, yoy1.end, "month"))
      .map((v, k) => [k, v.global.entrees])
      .sortBy(d => d[0])
      .value();

    var data = _([data0, data1])
      .unzip()
      .map(_.flatten)
      .map(d => {
        d.push((d[1] - d[3]) / d[3]);
        return d;
      })
      .value();

    var totalYoy = [_.sumBy(data, "1"), _.sumBy(data, "3")];

    // Après avoir calculé le total en année glissante, on élimine les données antérieures à l'année de référence, qu'on n'utilisera plus.
    // On calcule pour cela l'année de référence.
    var maxYear = moment(_(data).maxBy(d => moment(d[0]).year())[0]).year();
    data = _(data)
      .filter(d => moment(d[0]).year() === maxYear)
      .value();

    data = _({}).assign(extendDataForViews(data), { yoy: totalYoy }).value();

    return ctx.render("progression", data);
  } catch (e) {
    console.log(e);
  }
};

/**
 * yoy (year-on-year)
 * Obtention des dates de début et fin d'année glissante jusqu'à la fin du mois échu (par rapport à la date courante)
 * TODO: pouvoir passer en paramètre la date servant de référence (qu'elle ne soit pas forcément la date courante)
 * @param negOffsetY {integer} Obtention de la même période pour l'année n moins offset.
 * @return {Object: Moment, Moment}
 */
function yoy(negOffsetY) {
  negOffsetY = Math.abs(negOffsetY || 0);
  var ref = moment()
    .startOf("month")
    .subtract(1, "months")
    .endOf("month");
  var end = ref.clone().subtract(negOffsetY, "years");
  var start = ref
    .clone()
    .subtract(negOffsetY + 1, "years")
    .add(1, "day")
    .startOf("day");
  return {
    start: start,
    end: end
  };
}
