const _ = require("lodash");
const moment = require("moment");
const db = require("../services/db");
const config = require("../config");
const extendDataForViews = require("../helpers/extendDataForViews");

module.exports = async function (ctx, next) {
  var queryDate;
  var data;

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

    return ctx.render("day",
      _({}).assign(
        extendDataForViews(data),
        { date: queryDate }
      )
      .value()
    );
  } catch (e) {
    console.log(e);
  }
};


/**
 * tarifCat
 * A partir du nombres de billets vendus par code tarifaire et d'une liste de catégories des codes tarifaires, on obtient le nombre de billets vendus par catégorie.
 * L'ordre de sortie suit l'ordre d'énumération des catégories tarifaires (`cats`).
 * @param tarif {Object} {"code1": compte1, "code2": compte2, ...}
 * @param cats {Array} [["cat1": [code1, code2, code3, ...]], ["cat2": [code4, code5, ...]], ...]
 * @return {Array} [["cat1": compte1], ["cat2": compte2], ...]
 */
function tarifCat (tarif, cats) {
  return _(
    _(tarif).map((v, k) => {
      return _.fromPairs([[
        _(_.fromPairs(cats)).findKey(c => _.indexOf(c, parseInt(k, 10)) > -1) || "Autres",
        v
      ]]);
    })
    .reduce((acc, item) => {
      return _({}).assignWith(acc, item, (a, b) => _.sum([a, b])).value();
    })
  )
  .toPairs()
  .sortBy(d => {
    return _(cats).map((e, i) => [e[0], i]).fromPairs().value()[d[0]];
  })
  .value();
}
