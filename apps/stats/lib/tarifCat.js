const _ = require("lodash");

module.exports = tarifCat;

/**
 * tarifCat
 * A partir du nombres de billets vendus par code tarifaire et d'une liste de catégories des codes tarifaires, on obtient le nombre de billets vendus par catégorie.
 * L'ordre de sortie suit l'ordre d'énumération des catégories tarifaires (`cats`).
 * @param tarif {Object} {"code1": compte1, "code2": compte2, ...}
 * @param cats {Array} [["cat1": [code1, code2, code3, ...]], ["cat2": [code4, code5, ...]], ...]
 * @return {Array} [["cat1": compte1], ["cat2": compte2], ...]
 */
function tarifCat(tarif, cats) {
  return _(
    _(tarif)
      .map((v, k) => {
        return _.fromPairs([
          [
            _(_.fromPairs(cats)).findKey(
              c => _.indexOf(c, parseInt(k, 10)) > -1
            ) || "Non identifié",
            v
          ]
        ]);
      })
      .reduce((acc, item) => {
        return _({})
          .assignWith(acc, item, (a, b) => _.sum([a, b]))
          .value();
      })
  )
    .toPairs()
    .sortBy(d => {
      return _(cats)
        .map((e, i) => [e[0], i])
        .fromPairs()
        .value()[d[0]];
    })
    .value();
}