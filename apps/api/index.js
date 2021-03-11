const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const _ = require("lodash");
const cors = require("@koa/cors");
const router = require("./router.js");
const app = new Koa();
const enforceHttps = require("koa-sslify");

// Enforce https (https://github.com/turboMaCk/koa-sslify)
// Désactiver pour tests sur localhost
app.use(
  enforceHttps({
    trustProtoHeader: true,
  })
);

app
  .use(cors({ origin: "*" }))
  .use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get("X-Response-Time");
    console.log(`${ctx.method} ${ctx.url} - ${rt}`);
  })
  .use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set("X-Response-Time", `${ms}ms`);
  })
  .use(
    bodyParser({
      onerror: function (e, ctx) {
        ctx.throw(e);
      },
    })
  )
  .use(router.routes())
  .use(router.allowedMethods());

module.exports = app;
