var request = require("request-promise");
var cheerio = require("cheerio");

module.exports = async function(ctx, next) {
  ctx.type = "text/html; charset=utf-8";

  return request({
    method: "GET",
    uri: "http://www.cinematheque.fr/calendrier.html",
    resolveWithFullResponse: false,
    transform: body => cheerio.load(body)
  })
    .then($ => {
      var data = $("div.day.today").html();
      // data = data.replace(/(href=")([^"]+)(")/gi, "$1javascript: void 0;$3");
      return ctx.render("calendar", { data: data });
    })
    .catch(err => {
      console.log(err);
    });
};
