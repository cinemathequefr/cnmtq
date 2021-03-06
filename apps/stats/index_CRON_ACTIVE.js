const Koa = require("koa");
const serve = require("koa-static");
const views = require("koa-views");
const bodyParser = require("koa-bodyparser");
const passport = require("koa-passport");
const schedule = require("node-schedule");
const sync = require("./services/sync");
const moment = require("moment");
const timezone = require("moment-timezone");
const config = require("./config");
const router = require("./routes");
const controllers = require("./controllers");
var enforceHttps = require("koa-sslify");

moment.tz.setDefault("Europe/Paris");
moment.updateLocale("fr", config.momentLocaleFr);
const syncJob = schedule.scheduleJob(
  {
    hour: 22,
    minute: 45,
  },
  async function () {
    await sync.past();
    await controllers.mailReport.daily(
      moment().format("YYYY-MM-DD"),
      config.mail.recipients
    );
  }
);

const app = (module.exports = new Koa());

// Enforce https (https://github.com/turboMaCk/koa-sslify)
// Désactiver pour tests sur localhost
app.use(
  enforceHttps({
    trustProtoHeader: true,
  })
);

// Body parser + Passport
app.use(bodyParser());
require("./lib/auth");
app.use(passport.initialize());
app.use(passport.session());

app.use(serve(__dirname + "/public"));

app.use(
  views(__dirname + "/views", {
    map: {
      html: "lodash",
    },
    options: {
      partials: {
        header: "partials/header",
      },
    },
  })
);

app.use(router.public.routes());

// Protection des routes privées
app.use(async (ctx, next) => {
  await next();
  if (ctx.status === 401) {
    // TODO: cookie to redirect after login
    // ctx.cookies.set("redir", ctx.originalUrl);
    ctx.redirect("/login");
  }
});

app.use(router.private.routes());
