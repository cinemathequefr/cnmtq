module.exports = async function (ctx, next) {
  ctx.type = "text/html; charset=utf-8";
  return ctx.render("homepage", { data: null });
};