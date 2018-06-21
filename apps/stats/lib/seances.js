const _ = require("lodash");
const moment = require("moment");
const config = require("../config");

/**
 *
 * seances
 * Transformation de données de séances : délimitation temporelle et agrégation
 * @param inData {Array:Object} Données de séances
 * @param dateFrom {string} Date "YYY-MM-DD" de début de la requête. Obligatoire
 * @param dateTo {string} Date "YYY-MM-DD" de fin de la requête. Obligatoire
 * @param _aggregateKey {string} Nom d'une fonction d'agrégation préexistante ou fonction d'agrégation. Facultatif (TODO: possibilité de passer une fonction d'agrégation)
 * @return {Array:Object} Données de séances après délimitation temporelle et éventuelle agrégation
 */
function seances(inData, dateFrom, dateTo, _aggregateKey) {
  const aggregateFn = {
    global: d => true,
    day: d => moment(d.date).format("YYYY-MM-DD"),
    week: d => moment(d.date).format("YYYY-[W]WW"),
    month: d => moment(d.date).format("YYYY-MM"),
    year: d => moment(d.date).format("YYYY"),
    timeslot: d =>
      createTimeSlotFn([
        "07:00",
        "13:00",
        "15:00",
        "17:00",
        "19:00",
        "21:00",
        "23:00"
      ])(moment(d.date).format("HH:mm")),
    weekday: d => moment(d.date).isoWeekday(),
    monthfold: d => moment(d.date).format("M")
  };
  var aggregateKey;

  try {
    // Validation simple des paramètres dateFrom et dateTo
    if (
      !!dateFrom === false ||
      !!dateTo === false ||
      moment(dateFrom).isValid() === false ||
      moment(dateTo).isValid() === false
    ) {
      throw "Invalid date parameter.";
    }

    if (_aggregateKey) {
      aggregateKey = _.keys(aggregateFn).find(d => d === _aggregateKey);

      if (!aggregateKey)
        throw `Invalid aggregate parameter ${_aggregateKey}. Accepted values are: ${_(
          aggregateFn
        )
          .map((v, k) => k)
          .value()
          .join("|")} or a function.`;
    }

    return _(inData)
      .filter(d => moment(d.date).isBetween(dateFrom, dateTo, "day", "[]"))
      .thru(d => {
        if (aggregateKey) {
          return _(d)
            .groupBy(aggregateFn[aggregateKey])
            .mapValues(period => aggregateSeances(period))
            .value();
        } else {
          return d;
        }
      })
      .value();
  } catch (e) {
    return { error: e };
  }
}

/**
 * aggregateSeances
 * Calcule des valeurs agrégées (sommes et moyennes) à partir d'un tableau de séances
 * Le résultat est donné pour chacune des salles, puis globalement
 * @param {Array:Object}
 * @returns {Object:Object}
 */
function aggregateSeances(seances) {
  return _({})
    .assign(
      // Répartit les séances par salle
      { 1: [], 2: [], 3: [], 4: [] },
      _(seances)
        .groupBy(b => b.salle.id)
        .value()
    )
    .mapValues(function(c, i) {
      // Agrège les données de chaque salle
      return {
        seances: c.length,
        capacite: c.length * config.capacity[i],
        entrees: _(c).sumBy(d => d.tickets.compte),
        web: _(c).sumBy(function(d) {
          return d.tickets.web;
        }),
        recette: _(c).sumBy(function(d) {
          return d.tickets.recette;
        })
      };
    })
    .thru(function(b) {
      // Calcule la somme des valeurs pour toutes les salles et l'inscrit dans une propriété global
      var ks = _.keys(b["1"]);
      return _(b)
        .assign({
          global: _.zipObject(
            ks,
            _.map(ks, function(k) {
              return _(b).reduce(function(acc, val) {
                return val[k] + acc;
              }, 0);
            })
          )
        })
        .value();
    })
    .thru(function(b) {
      // Moyennes
      return _(b)
        .mapValues(function(c) {
          return _(c)
            .assign({
              moyEntreesSeance: round(c.entrees / c.seances, 4),
              tauxRemplissage: round(c.entrees / c.capacite, 4)
            })
            .value();
        })
        .value();
    })
    .value();
}

/**
 * createTimeSlotFn
 * A partir d'un tableau représentant un découpage horaire de la journée (créneaux), crée une fonction renvoyant le créneau dans lequel se trouve une heure
 * @param {Array:string} Tableau *ordonné* d'heures de début de créneau (ex. : ["07:00", "13:00", "15:00", "17:00", "19:00", "21:00", "23:00"])
 * @return {Function}
 */
function createTimeSlotFn(ts) {
  var mts = _(ts)
    .map(hhmm => moment(hhmm, "HH:mm"))
    .value();
  return function(hhmm) {
    var found;
    var o = _(mts).reduceRight(function(acc, i) {
      return found ? found : !i.isAfter(acc) ? (found = i) : acc;
    }, moment(hhmm, "HH:mm"));
    if (!found) o = _.last(mts); // If the input time is before the first slot, then it goes to the last (for late night shows)
    return o.format("HH:mm");
  };
}

/**
 * round
 * Round a number to the given decimal places
 * Note: the `toFixed` method returns a string
 * @param value {number} Value to be rounded
 * @param decimals {integer} Decimal places
 * @return {number}
 */
function round(value, decimals) {
  return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

/**
 * isValidDateFromDateTo(_dateFrom, _dateTo)
 * Vérifie qu'une date de début et une date de fin sont fournies, et que la date de fin n'est pas postérieure à la date de début.
 * TODO: prise en compte d'une heure par défaut quand elle n'est pas donnée.
 * NON UTILISE POUR LE MOMENT
 * @param _dateFrom {string|Moment} Date de début. Objet moment ou chaîne représentant une date.
 * @param _dateTo {string|Moment} Date de fin. Objet moment ou chaîne représentant une date.
 * @return {boolean} 
 */
/*
function isValidDateFromDateTo(_dateFrom, _dateTo) {
  if (!!_dateFrom === false || !!_dateTo === false) return false;
  var dateFrom = moment(_dateFrom);
  var dateTo = moment(_dateTo);
  if (dateFrom.isValid() === false || dateTo.isValid() === false) return false;
  if (moment(dateTo).isBefore(dateFrom, "minute") === true) return false;
  return true;
}
*/

module.exports = seances;