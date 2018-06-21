const _ = require("lodash");
const moment = require("moment");
const dbSeances = require("../services/db")("seances");
const config = require("../config");
const tarifCat = require("../lib/tarifCat");
const extendDataForViews = require("../lib/extendDataForViews");
const seances = require("../lib/seances");

module.exports = async function(ctx, next) {
  var data;
  var footRows;
  var refMonth;
  var maxMonth;
  var variable = "entrees";

  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }

  ctx.type = "text/html; charset=utf-8";

  try {
    maxMonth = moment()
      .startOf("month")
      .subtract(1, "months")
      .endOf("month");

    refMonth = ctx.request.query.date
      ? moment(ctx.request.query.date).endOf("month")
      : maxMonth;

    if (maxMonth.isBefore(refMonth)) refMonth = maxMonth;

    data = seances(
      dbSeances.getState(),
      refMonth
        .clone()
        .subtract(23, "months")
        .startOf("month"),
      refMonth,
      "month"
    );

    data = _(data)
      .mapValues(d => d.global[variable])
      .toPairs()
      .sortBy(d => d[0])
      .value();

    if (data.length < 24)
      throw "Les données disponibles ne sont pas suffisantes pour construire ce rapport.";

    data = _(data)
      .chunk(12)
      .unzip()
      .map(_.flatten)
      .map(d => [moment(d[2]).month(), d[3], d[1]])
      .value();

    footRows = _([])
      .concat([
        ["Année glissante", _(data).sumBy(d => d[1]), _(data).sumBy(d => d[2])]
      ])
      .value();

    // Retire les données d'avant le mois de janvier
    data = _(data)
      .thru(_data => {
        var a = [];
        var found = false;
        _(_data).forEach(d => {
          found = found || d[0] === 0;
          if (found) a.push(d);
        });
        return a;
      })
      .value();

    footRows = _(footRows)
      .concat([["Cumul", _(data).sumBy(d => d[1]), _(data).sumBy(d => d[2])]])
      .reverse()
      .value();

    data = _(data)
      .map(d => [
        _.upperFirst(
          moment()
            .month(d[0])
            .format("MMMM")
        ),
        d[1],
        d[2]
      ])
      .concat(footRows)
      .map(d =>
        _(d)
          .concat([(d[1] - d[2]) / d[2]])
          .value()
      )
      .value();

    return ctx.render(
      "progression",
      extendDataForViews(data, { refMonth: refMonth })
    );
  } catch (e) {
    console.log(e);
  }
};
