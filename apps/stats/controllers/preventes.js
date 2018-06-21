const _ = require("lodash");
const moment = require("moment");
const dbFuture = require("../services/db")("future");
const config = require("../config");
// const tarifCat = require("../lib/tarifCat");
const extendDataForViews = require("../lib/extendDataForViews");

module.exports = async function(ctx, next) {
  var data;

  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }

  ctx.type = "text/html; charset=utf-8";

  try {

    data = dbFuture.getState();

    return ctx.render(
      "preventes",
      extendDataForViews(data)
    );
  } catch (e) {
    console.log(e);
  }
};
