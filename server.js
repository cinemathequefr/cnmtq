const _ = require("lodash");
const compose = require("koa-compose");
const compress = require("koa-compress"); // https://github.com/koajs/compress
const session = require("koa-session");
const Koa = require("koa");
const helmet = require("koa-helmet");
const config = require("./config");

const server = module.exports = new Koa();

const vhostApps = [ // Mapping vhosts/apps
  { vhost: "localhost", app: require("./apps/stats/index.js") },
  { vhost: "stats.cnmtq.fr", app: require("./apps/stats/index.js") },
  { vhost: "www.cnmtq.fr", app: require("./apps/www/index.js") }
];

server.keys = config.session.keys;

server.use(helmet());

server.use(compress({
  flush: require("zlib").Z_SYNC_FLUSH
}));

// Global logger
server.use(async function (ctx, next) {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  if ("test" != process.env.NODE_ENV) {
    console.log('%s %s %s - %sms', ctx.host, ctx.method, ctx.url, ms);
  }
});

server.use(session(server));

server.use(async function (ctx, next) {
  const app = _(vhostApps).find({ vhost: ctx.hostname }).app; // See: https://github.com/koajs/examples/tree/master/vhost
  return await app ? compose(app.middleware).apply(this, [ctx, next]) : next(); // https://stackoverflow.com/questions/48380123/object-isnt-an-instance-of-koa-on-the-require-side
});

if (!module.parent) server.listen(process.env.PORT || 80);