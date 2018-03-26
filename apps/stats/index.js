const Koa = require("koa");
const serve = require("koa-static");
const views = require("koa-views");

const bodyParser = require("koa-bodyparser");
const passport = require("koa-passport");
const LocalStrategy = require("passport-local").Strategy;

const schedule = require("node-schedule");
const sync = require("./services/sync");
const moment = require("moment");
const timezone = require("moment-timezone");
const config = require("./config");
const router = require("./routes");
const controllers = require("./controllers");

moment.tz.setDefault("Europe/Paris");
moment.updateLocale("fr", config.momentLocaleFr);
const syncJob = schedule.scheduleJob(
  { hour: 22, minute: 15 },
  async function () {
    await sync.run();
    await controllers.mailReport.daily();
  }
);

const app = module.exports = new Koa();


passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));



app.use(bodyParser());
app.use(passport.initialize());
app.use(passport.session());

app.use(serve(__dirname + "/assets"));

app.use(
  views(__dirname + "/views", {
    map: { html: "lodash" },
    options: { partials: { header: "partials/header"} }
  })
);

app.use(router.routes());