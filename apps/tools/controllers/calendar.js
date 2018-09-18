var request = require("request-promise");
var cheerio = require("cheerio");
var _ = require("lodash");

module.exports = async function(ctx, next) {
  ctx.type = "text/html; charset=utf-8";

  // On récupère le calendrier (object sélection cheerio)
  var $calendar = await getCalendar();

  // Tableau des URLs de séances
  var urls = $calendar
    .clone()
    .find(".show")
    .map((i, el) => {
      var $ = cheerio.load(el);
      return (url = $(".show").attr("href"));
    })
    .get();

  // Quand toutes les lignes d'infos ont été obtenues, on les intègre (un par film, dans l'ordre d'apparition) au DOM calendar
  return Promise.all(
    _(urls)
      .map(url => getShowInfo(url))
      .value()
  ).then(infos => {
    infos = _.flatten(infos);
    $calendar.find(".film").each((i, elem) => {
      $calendar
        .find(elem)
        .append(
          infos[i] === "" ? null : "<span class='infos'>" + infos[i] + "</span>"
        );
    });

    var html = $calendar
      .html()
      .replace(/(href=")([^"]+)(")/gi, "$1javascript: void 0;$3") // Remplace les liens
      .replace(/(16|35|70)mm/gi, "$1 mm"); // Corrige erreur typographique

    return ctx.render("calendar", {
      data: html
    });
  });
};

/**
 * getCalendar
 * Fait une requête http sur le calendrier général et extrait le bloc de la date du jour
 * @return {object} sélection cheerio
 */
async function getCalendar() {
  return request({
    method: "GET",
    uri: "http://www.cinematheque.fr/calendrier.html",
    resolveWithFullResponse: false
  })
    .then(html => {
      return cheerio
        .load(html)
        .root()
        .find("div.day.today"); // Si on veut le bloc du lendemain (noeud frère suivant), ajouter `.next()`
    })
    .catch(err => err);
}

/**
 * getShowInfo
 * Renvoie les infos techniques des films d'une séance
 * @param {string} url : url d'une page séance (seance/[id].html)
 * @return {array:string} Tableau des infos techniques (pays, année, format, version) de chaque film de la séance
 */
function getShowInfo(url) {
  return request({
    method: "GET",
    uri: "http://www.cinematheque.fr/" + url,
    resolveWithFullResponse: false
  })
    .then(html => {
      return cheerio
        .load(html)
        .root()
        .find(".film")
        .map((i, el) => {
          var $el = cheerio.load(el);
          return _.trim(
            $el(".film")
              .children(".realisateur")
              .next() // Le noeud recherche est un noeud texte, voisin du noeud de classe `.realisateur`.
              .text()
          );
        })
        .get();
    })
    .catch(err => err);
}