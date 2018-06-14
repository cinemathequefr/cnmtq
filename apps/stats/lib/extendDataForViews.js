const _ = require("lodash");
const moment = require("moment");
const format = require("number-format.js");

module.exports = extendDataForViews;

/**
 * extendDataForViews
 * Extends the data passed to the views (lodash templates) with useful methods
 * Original data are output as the value of a `data` key
 * This function to be used in controllers
 * @param data { Collection }
 * @param obj { Object } Any extra object that may be useful for the view
 * @return { Object }
 */
function extendDataForViews(data, obj) {
  return _({})
    .assign({
      moment: moment,
      format: format,
      data: data,
      signed: signed
    })
    .assign(obj || {})
    .value();
}

/**
 * signed
 * Renvoie un nombre sous forme de chaîne signée (précédée du signe + ou -, sauf pour 0).
 * @param n {number|string}
 * @return {string}
 */
function signed(n) {
  return `${parseInt(n) > 0 ? "+" : ""}${n}`;
}