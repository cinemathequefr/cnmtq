const _ = require("lodash");
const fs = require("fs");
const moment = require("moment");
const csvtojson = require("csvtojson"); // https://github.com/Keyang/node-csvtojson
const config = require("./config");

// TODO : supprimer si possible tout appel à config.js

module.exports = {
  aggregateTicketsToSeances: aggregateTicketsToSeances,
  calcDateFrom: calcDateFrom,
  csvToJson: _csvToJson,
  excludeSeances: excludeSeances,
  mergeSeances: mergeSeances,
  readJsonFile: readJsonFile,
  splitSeances: splitSeances,
  writeJsonFile: writeJsonFile
};


/**
 * __dateLastSeancesAvailable
 * A partir de données de séances *passées*, renvoie la date de la séance la plus récente (= date maximale).
 * @param seancesData {Array: Object}: données JSON de séances *passées*.
 * @return {Object moment} : date de la séance la plus récente.
 * TODO: sortir le chemin d'accès au fichier
 */
function __dateLastSeancesAvailable (seancesData) {
  return moment.max(_(seancesData).map(d => moment(d.date)).value());
}


/**
 * aggregateTicketsToSeances
 * TODO: documenter
 * TODO: supprimer la dépendance à l'objet config ?
 * @param data {Array: Object}: données JSON de tickets
 * @return {Array: Object}: données JSON de séances
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
        web: _(items).filter(function (item) { return _.indexOf(config.codesCanalWeb, item.idCanal) > -1; }).value().length // Codes canal de vente web
      }
    };
  })
  .filter(function (d) { return !_.isUndefined(d.salle); }) // Retire les items hors salle de cinéma
  .sortBy("date")
  .value();
}


/* calcDateFrom
 * Obtient la date à partir de laquelle requêter les données, en fonction de la date de la dernière séance présente dans les données.
 * Si les données passées sont à jour, on prend la date courante comme date de départ (pour requêter uniquement des données futures).
 * @param seancesData {Object}: données JSON de séances.
 * @return {promise: object} : objet moment, ou null si aucune mise à jour n'est nécessaire
 */
function calcDateFrom (seancesData) {
  var last = __dateLastSeancesAvailable(seancesData);
  return last.isSame(__yesterday(), "day") ? moment().startOf("day") : last.add(1, "days").startOf("day");
}


/**
 * _csvToJson
 * Convertit une chaîne CSV en objet JSON.
 * @param csv {String} : chaîne de données au format CSV.
 * @param headers {Array: String} : tableau des noms d'en-têtes de colonnes.
 * @return {Object} : Données JSON.
 */
function _csvToJson (csv, headers) {
 return new Promise((resolve, reject) => {
    var o = [];
    csvtojson({
      delimiter: ";",
      toArrayString: true,
      noheader: false,
      checkType: true, // Type inference
      headers: headers
    })
    .fromString(csv)
    .on("json", row => o.push(row))
    .on("error", err => reject(err))
    .on("done", () => resolve(o));
  });
}


/**
 * excludeSeances
 * Ajoute aux séances donc l'idSeance est présent dans une liste d'exclusion une propriété `{ exclude: true }`.
 * @param seancesData { Array: Object } : Collection de séances
 * @param excludeSeancesDara { Array } : Liste d'exclusion (idSeances)
 * @return { Array: Object } : Collection de séances
 */
function excludeSeances (seancesData, excludeSeancesData) {
  return _(seancesData).map(i => {
    return _(excludeSeancesData).indexOf(i.idSeance) > -1 ? _(i).assign({ exclude: true }).value() : i;
  }).value();
}


/**
 * mergeSeances
 * Fusionne un tableau de séances (initial) avec un tableau de séances supplémentaires (ajouts).
 * En cas de collision, les séances ajoutées sont prioritaires.
 * Cette fonction sert à mettre à jour les séances passées existantes avec les séances passées nouvelle obtenues.
 * @param {Object} seances : collection de séances.
 * @param {Object} added : collection de séances.
 */
function mergeSeances (seances, added) {
  return _(seances).concat(added).groupBy("idSeance").map(_.last).sortBy("date").value();
}


/**
 * readJsonFile
 * Fonction générique de lecture de fichier JSON encodé en utf-8.
 * @param path {String}: chemin d'accès.
 * @return {Promise: Object}: données JSON parsées.
 */
function readJsonFile (path) {
  return new Promise((resolve, reject) => {
    return fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        // console.log(data);
        resolve(JSON.parse(data));
      }
    });
  });
}


/**
 * splitSeances
 * Divise une collection de séances en deux collections (avant et à partir d'une date)
 * Pour l'usage actuel, on a besoin des séances passées (jusqu'à hier 23:59:00 inclus) et les séances futures (à partir d'aujourd'hui 00:00:00 inclus)
 * On recommande de passer en paramètre une date "de référence", même si c'est la date courante
 * @param seances {Object}  : collection de séances
 * @param atDate{Object: moment} : date pour la césure (par défaut date courante)
 */
function splitSeances (seances, atDate) {
  atDate = (atDate instanceof moment ? atDate : moment().startOf("day"));
  return _(seances).partition(d => moment(d.date).isBefore(atDate, "day")).value();
}


/**
 * today
 * Aujourd'hui (ou demain si on est mardi)
 * NB : non utilisé
 * @return {object} moment
 *
 */
// function today () {
//   var t = moment().startOf("day");
//   return t.isoWeekday() === 2 ? t.clone().add(1, "day") : t;
// }


/**
 * writeJsonFile
 * Fonction générique d'écriture de fichier JSON encodé en utf-8.
 * @param path {String}: chemin d'accès.
 * @return {Promise: Object}: données JSON parsées.
 */
function writeJsonFile (path, data) {
  return new Promise((resolve, reject) => {
    return fs.writeFile(
      path,
      JSON.stringify(data, null, 2),
      "utf8",
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}


/**
 * __yesterday
 * Détermine la date d'hier, qui sert de date finale des données passées
 * Une exception est faite pour le mardi (renvoie le lundi)
 * @return {object} moment
 */
function __yesterday () {
  var y = moment().startOf("day").subtract(1, "day");
  return y.isoWeekday() === 2 ? y.clone().subtract(1, "day") : y;
}
