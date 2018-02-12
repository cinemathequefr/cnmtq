const _ = require("lodash");
const fs = require("fs");
const moment = require("moment");
const config = require("./config.js");

module.exports = {
  aggregateTicketsToSeances: aggregateTicketsToSeances,
  dateLastSeancesAvailable: dateLastSeancesAvailable,
  calcDateFrom: calcDateFrom
};


/**
 *
 */
function aggregateTicketsToSeances (data) {
  return _(data)
  .map(function (item) {
    return _.assign({}, item, { montant: parseFloat((item.montant || "0").replace(",", ".")) });
  })
  .groupBy("idSeance")
  .map(function (items) {
    return {
      idSeance: items[0].idSeance,
      idManif: items[0].idManif,
      titre: items[0].titre,
      date: items[0].date,
      salle: config.salles[items[0].idSalle],
      tickets: {
        compte: items.length,
        recette: _.sumBy(items, item => item.montant),
        tarif: _(items).groupBy("tarif").mapValues(item => item.length).value(),
        // tarifCat: _(items).reduce(function (acc, item) {
        //   return _({}).assign(acc, (function (item) {
        //     if (_.indexOf(config.codesTarifsLp, item.tarif) > -1) return { lp: acc.lp + 1 }; // Codes tarifaires Libre Pass
        //     if (item.montant == 0) return { gratuit: acc.gratuit + 1 };
        //     return { payant: acc.payant + 1 };
        //   })(item))
        //   .value()
        // }, { payant: 0, lp: 0, gratuit: 0 }),
        web: _(items).filter(function (item) { return _.indexOf(config.codesCanalWeb, item.idCanal) > -1; }).value().length // Codes canal de vente web
      }
    };
  })
  .filter(function (d) { return !_.isUndefined(d.salle); }) // Retire les items hors salle de cinéma
  .sortBy("date")
  .value();
}


/**
 * dateLastSeancesAvailable
 * @return {promise: object} : objet moment de la dernière (= plus récente) date trouvée dans les données de séances passées
 * TODO: sortir le chemin d'accès au fichier
 */
function dateLastSeancesAvailable () {
  return new Promise((resolve, reject) => {
    fs.readFile(__dirname + "/../../data/seances.json", "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(moment.max(_(JSON.parse(data)).map(d => moment(d.date)).value()));
      }
    });
  });
}


/**
 * calcDateFrom
 * Obtient la date à partir de laquelle requêter les données (à partir dateLastSeancesAvailable)
 * @dependencies dateLastSeanceAvailable, moment, yesterday
 * @return {promise: object} : objet moment, ou null si aucune mise à jour n'est nécessaire
 */
async function calcDateFrom () {
  var last = await dateLastSeancesAvailable();
  return last.isSame(yesterday(), "day") ? null : last.add(1, "days").startOf("day");
}


/**
 * yesterday
 * Détermine la date d'hier, qui sert de date finale des données passées
 * Une exception est faite pour le mardi (renvoie le lundi)
 * @return {object} moment
 */
function yesterday () {
  var y = moment().startOf("day").subtract(1, "day");
  return y.isoWeekday() === 2 ? y.clone().subtract(1, "day") : y;
}


/**
 * today
 * Aujourd'hui (ou demain si on est mardi)
 * @return {object} moment
 *
 */
function today () {
  var t = moment().startOf("day");
  return t.isoWeekday() === 2 ? t.clone().add(1, "day") : t;
}












/**
 * calcDateFrom
 * Détermine la date de début pour la requête de données séances
 * - La date la plus récente pour laquelle des données sont déjà présentes dans seances.json (mais au plus tard hier)
 * - Si on ne peut pas la déterminer, la date de début historique des données
 * @return {string} Date au format YYYY-MM-DD
 * @todo : Séparer en deux promesses distinctes et consécutives : lecture de seances.json, puis détermination de la date de début de requête
 */
/*
function calcDateFrom () {
  var dateLastAvailable;
  return new Promise((resolve, reject) => {
    var reason = "La date de début de mise à jour n'a pas pu être déterminée. Vérifier le fichier de données ou utiliser le flag --force";
    fs.readFile("./data/seances.json", "utf8", (err, data) => {

      try {
        initialSeances = JSON.parse(data); // IMPORTANT : initialSeances est global et servira pour la fusion avec les séances passées ajoutées (la promesse aura été résolue) TODO: plutôt passer cette valeur dans la résolution de la promesse
      } catch(e) {
        initialSeances = [];
      }

      if (err) {
        reject(reason);
      } else {
        try {
          dateLastAvailable =  moment(moment.max(_(JSON.parse(data)).map(d => moment(d.date)).value()));
          if (dateLastAvailable.isSame(yesterday(), "day")) {
            resolve(null);
          } else {
            resolve(dateLastAvailable.add(1, "days"));
          }
        } catch(e) {
          console.log(e);
          reject(reason);
        }
      }
      resolve(dateLastAvailable);
    });
  });
}
*/