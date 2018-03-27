module.exports = async function (ctx, next) {
  // Déconnecter avant d'afficher la page de login ?
  // ctx.logout();
  // ctx.session = null;
  return ctx.render("login");
};