const Koa = require("koa");
const serve = require("koa-static");
const views = require("koa-views");
const schedule = require("node-schedule");
const sync = require("./services/sync");
const moment = require("moment");
const timezone = require("moment-timezone");
const router = require("./routes");
const controllers = require("./controllers");

moment.tz.setDefault("Europe/Paris");

const syncJob = schedule.scheduleJob(
  { hour: 22, minute: 15 },
  async function () {
    await sync.run();
    await controllers.mailReport.daily();
  }
);

const app = module.exports = new Koa();

app.use(serve(__dirname + "/assets"));
app.use(views(__dirname + "/views", { map: { html: "lodash" } }));
app.use(router.routes());