const passport = require("koa-passport");
const moment = require("moment");
const Router = require("koa-router");
const config = require("../config");
const controllers = require("../controllers");

const publicRouter = new Router();
const privateRouter = new Router();

publicRouter.redirect("/", "/day");
publicRouter.get("/login", controllers.login);
publicRouter.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/day",
    failureRedirect: "/login"
  })
);

publicRouter.get("/logout", controllers.logout);
privateRouter.get("/day", controllers.day);
privateRouter.get("/progression", controllers.progression);
privateRouter.get("/preventes", controllers.preventes);

privateRouter.get("/info", async function (ctx, next) {
  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }
  ctx.body = `${moment().format()}\n${JSON.stringify(config.mail.recipients)}`;
});

privateRouter.get("/api/seances", controllers.api.seances);

module.exports = {
  public: publicRouter,
  private: privateRouter
};
