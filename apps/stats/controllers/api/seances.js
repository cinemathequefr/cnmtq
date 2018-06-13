const _ = require("lodash");
// const moment = require("moment");
const db = require("../../services/db")("seances");
const config = require("../../config");
const seances = require("../../lib/seances.js");

module.exports = async function(ctx, next) {
  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }

  const query = objectToLowerCase(ctx.request.query);

  // En l'absence de dateFrom ou dateTo, on prend les dates extrêmes obtenues dans le module config.
  const dateFrom = query.datefrom || config.dateLowerLimit;
  const dateTo = query.dateto || config.dateUpperLimit;
  const aggregateKey = query.aggregate;

  ctx.type = "application/json; charset=utf-8";

  var outData = seances(db.getState(), dateFrom, dateTo, aggregateKey);
  if (!_.isUndefined(outData.error)) ctx.status = 400;
  ctx.body = outData;
  return;
};

/**
 * objectToLowerCase
 * Shallow conversion of the keys/string values of an object to lowercase.
 * Used to format query parameters (given as an object).
 * @param o {object}
 * @return o {object}
 */
function objectToLowerCase(o) {
  return _(o)
    .mapKeys((v, k) => k.toLowerCase())
    .mapValues((v, k) => (typeof v === "string" ? v.toLowerCase() : v))
    .value();
}