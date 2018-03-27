module.exports = async function (ctx, next) {
  ctx.logout();
  ctx.session = null;
  ctx.redirect("/login");
  // return ctx.render("logout");
};