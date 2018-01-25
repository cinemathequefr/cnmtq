const Router = require("koa-router");
const moment = require("moment");
const queries = require("../db/queries");
const config = require("../config");

const router = new Router();

moment.locale("fr", config.momentLocaleFr);

router.get("/date/:date", async function (ctx, next) {
  ctx.type = "text/html; charset=utf-8";
  try {
    var data = queries.date(ctx.params.date);
    return ctx.render("date", { moment: moment, data: data });
  } catch (err) {
    console.log(err);
    return;
  }
});

module.exports = router;