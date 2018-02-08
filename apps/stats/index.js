const Koa = require("koa");
const serve = require("koa-static");
const views = require("koa-views");
const router = require("./routes");

const app = module.exports = new Koa();



app.use(serve(__dirname + "/assets"));
app.use(views(__dirname + "/views", { map: { html: "lodash" } }));
app.use(router.routes());

if (!module.parent) app.listen(process.env.PORT || 80);