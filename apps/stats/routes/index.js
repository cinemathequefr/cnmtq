const router = new require("koa-router")();
const moment = require("moment");
const config = require("../config");
const controllers = require("../controllers");

moment.locale("fr", config.momentLocaleFr);

router.get("/day", controllers.day);
router.get("/day/:date", controllers.day);

router.get("/info", async function (ctx, next) {
  ctx.body = `${ moment().format() }\n${ JSON.stringify(config.mail.recipients) }`;
});

// router.get("/testmail", async function (ctx, next) {});

module.exports = router;