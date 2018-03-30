const _ = require("lodash");
const moment = require("moment");
const db = require("../../services/db")("seances");
const config = require("../../config");

module.exports = async function(ctx, next) {
  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }

  const query = ctx.request.query;
  const dateFrom =
    validateISODateString(query.datefrom) || config.dateLowerLimit;
  const dateTo = validateISODateString(query.dateto) || config.dateUpperLimit;

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

  const aggregateKey =
    _.keys(aggregateFn).find(d => d === query.aggregate) || null;
  var data = db.getState();

  data = _(data)
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

  ctx.type = "application/json; charset=utf-8";
  ctx.body = data;
};

/**
 * validateISODateString
 * Returns the input "YYYY-MM-DD" if it is a valid date, otherwise `null`
 * @param date {string}
 * @returns {(string|null)}
 */
function validateISODateString(date) {
  return isValidISODateString(date) ? date : null;
}

/**
 * isValidISODateString
 * Checks if a string is a valid "YYYY-MM-DD" date (includes leap years)
 * @param date {string}
 * @returns {boolean}
 */
function isValidISODateString(date) {
  return /^((((19|[2-9]\d)\d{2})\-(0[13578]|1[02])\-(0[1-9]|[12]\d|3[01]))|(((19|[2-9]\d)\d{2})\-(0[13456789]|1[012])\-(0[1-9]|[12]\d|30))|(((19|[2-9]\d)\d{2})\-02\-(0[1-9]|1\d|2[0-8]))|(((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))\-02\-29))$/.test(
    date
  );
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
              moyEntreesSeance: c.entrees / c.seances,
              tauxRemplissage: c.entrees / c.capacite
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