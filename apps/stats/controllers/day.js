const _ = require("lodash");
const moment = require("moment");
const db = require("../services/db");
const config = require("../config");
const tarifCat = require("../helpers/tarifCat");
const extendDataForViews = require("../helpers/extendDataForViews");

module.exports = async function (ctx, next) {
  var queryDate;
  var data;

  console.log(ctx.isAuthenticated());

  ctx.type = "text/html; charset=utf-8";

  try {
    queryDate = ctx.params.date || db.map(d => d.date).max().value().substring(0, 10); // TODO: validation du paramètre

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

    return ctx.render("day", data);
  } catch (e) {
    console.log(e);
  }
};
