const Koa = require("koa");
const serve = require("koa-static");
const views = require("koa-views");
const schedule = require("node-schedule");  

const router = require("./routes");
const sync = require("./services/sync");

const syncJob = schedule.scheduleJob({ hour: 21, minute: 15 }, sync); // (Attention: heure UTC) Tous les jours à 22:15 (https://github.com/node-schedule/node-schedule#object-literal-syntax)

const app = module.exports = new Koa();

app.use(serve(__dirname + "/assets"));
app.use(views(__dirname + "/views", { map: { html: "lodash" } }));
app.use(router.routes());

if (!module.parent) app.listen(process.env.PORT || 80);