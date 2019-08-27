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
  (ctx, next) => {
    passport.authenticate("local", function (err, user) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return ctx.redirect("/login");
      }
      ctx.login(user, err => {
        if (err) {
          return next(err);
        }
        return ctx.redirect(ctx.cookies.get("redir") || "/day");
      })
    })(ctx, next)
  }
);

// publicRouter.post(
//   "/login",
//   passport.authenticate("local", {
//     successRedirect: "/day",
//     failureRedirect: "/login"
//   })
// );

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