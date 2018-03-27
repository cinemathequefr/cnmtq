const passport = require("koa-passport");
const moment = require("moment");
const Router = require("koa-router");
const config = require("../config");
const controllers = require("../controllers");

const publicRouter = new Router();
const privateRouter = new Router();

publicRouter.get("/", controllers.home);
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
privateRouter.get("/day/:date", controllers.day);

privateRouter.get("/info", async function (ctx, next) {
  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }  
  ctx.body = `${ moment().format() }\n${ JSON.stringify(config.mail.recipients) }`;
});


// Utiliser cette route pour lancer manuellemet l'envoi du rapport quotidien
privateRouter.get("/sendmail", async function (ctx, next) {
/*
  try {
    console.log(
      await controllers.mailReport.daily()
    );
  } catch (e) {
  	console.log(e);
  }
*/
});

module.exports = {
  public: publicRouter,
  private: privateRouter
}