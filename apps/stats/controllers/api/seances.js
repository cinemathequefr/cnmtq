const _ = require("lodash");
const moment = require("moment");
const db = require("../../services/db")("seances");
const config = require("../../config");

module.exports = async function(ctx, next) {
  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }

  const query = ctx.request.query;
  const dateFrom = query.datefrom; // Attention: case-sensitive
  const dateTo = query.dateto;

  var data = db.filter(d => moment(d.date).isBetween(dateFrom, dateTo, "day", "[]"));

  ctx.type = "application/json; charset=utf-8";
  ctx.body = data;

};