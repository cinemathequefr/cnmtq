const _ = require("lodash");
const moment = require("moment");
const request = require("request-promise"); // https://github.com/request/request-promise
const csvtojson = require("csvtojson"); // https://github.com/Keyang/node-csvtojson
const fs = require("fs");
const config = require("../../config");
const dbSeances = require("../db")("seances");
const dbFuture = require("../db")("future");


/**
 * future
 * Exécute une requête sur les séances futures et écrit le fichier future.json
 */
async function future() {
  var currentDate = moment().startOf("day"); // On capture la date courante
  var dateFrom;
  var dateTo;
  var fetchedSeancesData;

  return new Promise(async function (resolve, reject) {
    try {
      dateFrom = currentDate.format("YYYY-MM-DD");
      dateTo = currentDate
        .clone()
        .add(120, "days")
        // .add(config.sync.lookAheadDays, "days")
        .format("YYYY-MM-DD"); // 2018-03-06 : on prend pour date de fin de requête la date du jour (+ lookAheadDays)

      fetchedSeancesData = (await query(dateFrom, dateTo))[1]; // On ne garde que les séances futures (index: 1)

      fetchedSeancesData = _(fetchedSeancesData)
        .thru(d => _.fromPairs([
          [moment().format(), d]
        ]))
        .value();

      dbFuture.setState(fetchedSeancesData); // Update data in lowdb (https://github.com/typicode/lowdb)
      dbFuture.write();
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * past
 * Exécute une requête sur les séances passées (depuis la dernière synchro) et écrit le fichier seances.json
 * 
 */
async function past() {
  var currentDate = moment().startOf("day"); // On capture la date courante
  var dateFrom;
  var dateTo;
  var existingSeancesData;
  var fetchedSeancesData;
  var updatedSeancesData;

  return new Promise(async function (resolve, reject) {
    try {
      existingSeancesData = await Promise.all([
        readJsonFile(__dirname + "/../../data/seances.json"), // données passées
        [] // TODO: données futures
      ]);

      dateFrom = calcDateFrom(existingSeancesData[0]).format("YYYY-MM-DD");
      dateTo = currentDate.clone().format("YYYY-MM-DD");

      fetchedSeancesData = await query(dateFrom, dateTo);
      updatedSeancesData = mergeSeances(
        existingSeancesData[0],
        fetchedSeancesData[0]
      );

      dbSeances.setState(updatedSeancesData); // Update data in lowdb (https://github.com/typicode/lowdb)
      dbSeances.write();
      // DONE: utiliser la méthode `write` de lowdb (elle devrait être est asynchrone)
      // await writeJsonFile(
      //   __dirname + "/../../data/seances.json",
      //   updatedSeancesData
      // );

      console.log(
        `${moment().format()} : Séances passées : Synchronisation terminée, ${
        fetchedSeancesData[0].length
        } séances ajoutées ou réécrites.`
      );
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}



/**
 * query
 * Effectue une synchronisation des données de séances entre deux dates
 * @param {string} dateFrom Date de début de requête (YYYY-MM-DD)
 * @param {string} dateTo Date de fin de requête (YYYY-MM-DD)
 * @return {Promise}
 */
async function query(dateFrom, dateTo) {
  var connectId;
  var fetchedTicketsCsv;
  var fetchedTicketsJson;
  var fetchedSeancesData;
  var fetchedSeancesDataSplit;

  return new Promise(async function (resolve, reject) {
    try {
      connectId = await connect(
        config.sync.connectUrl,
        config.sync.login,
        config.sync.password
      );
      fetchedTicketsCsv = await httpQuery(
        connectId,
        _.template(config.sync.requestTemplates.tickets)({
          dateFrom: dateFrom,
          dateTo: dateTo
        })
      );
      fetchedTicketsJson = await _csvToJson(
        fetchedTicketsCsv,
        config.sync.jsonHeaders["tickets"]
      );
      fetchedSeancesData = aggregateTicketsToSeances(fetchedTicketsJson);
      fetchedSeancesDataSplit = splitSeances(fetchedSeancesData); // => [[passées], [futures]]
      resolve(fetchedSeancesDataSplit);
    } catch (e) {
      reject(e);
    }
  });
}


/**
 * connect
 * (Etape 1)
 * Effectue une requête de connexion sur le serveur distant.
 * En cas de réussite, un cookie est inscrit (géré automatiquement par jar)
 * @param url { String }
 * @param login { String }
 * @param password { String }
 * @return ID de connexion { Promise }
 * @date 2017-06-13
 * @date 2018-02-07 : utilise async/await
 */
async function connect(url, login, password) {
  process.stdout.write("Connexion au serveur : ");
  try {
    var res = await request({
      method: "POST",
      uri: url,
      followRedirect: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `login=${login}&motPasse=${password}&Submit=Valider`,
      simple: false,
      jar: true,
      resolveWithFullResponse: true
    });

    // 2019-07-12 : Mise à jour pour suivre la modification du processus de connexion côté serveur.
    // 2019-11-04 : On affiche connectId pour s'assurer qu'il a bien été inscrit, mais il est géré par le cookie jar.
    var connectId = _(res.headers["set-cookie"]).filter(d => _.startsWith(d, config.sync.cookieKey)).value()[0];
    connectId = connectId.match(/=([a-z\d]+);/)[1];

    process.stdout.write(`OK\n${connectId}\n`);
    return connectId;
  } catch (e) {
    process.stdout.write("Echec\n");
    throw "";
  }
}


/**
 * httpQuery
 * (Etapes 2 et 3)
 * Fait une requête distante pour obtenir des données
 * 2019-11-04 : connectId n'est plus nécessaire.
 * @param queryUrl {String} URL de la requête
 * @param requestBody {String} Corps de la requête (à construite à partir de templates présents dans le fichier config)
 * @return {String} Chaîne de type csv
 * @date 2017-06-13 : version initiale
 * @date 2018-02-07 : utilise async/await
 * @todo Convertir la réponse en utf-8
 */
async function httpQuery(connectId, requestBody) {
  let sessionId;
  let res;

  // Envoi de la requête (= génère les données sur le serveur distant) et récupération du jeton `sessionId`.
  process.stdout.write("Envoi de la requête : ");
  try {
    res = (await request({
      method: "POST",
      uri: config.sync.queryUrl,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
        // , Cookie: config.sync.cookieKey + "=" + connectId
      },
      json: true,
      body: requestBody,
      simple: false,
      jar: true,
      resolveWithFullResponse: true
    }));

    sessionId = res.body.data.sessionId;

    process.stdout.write(`OK\n${sessionId}\n`);
  } catch (e) {
    process.stdout.write("Echec\n");
    // DEBUG
    process.stdout.write(JSON.stringify(e, null, 2));
    throw "";
  }

  // Récupération des données
  process.stdout.write("Récupération des données : ");
  try {
    res = await request({
      method: "GET",
      uri: config.sync.queryUrl + "&op=dl&format=csv&id=" + sessionId,
      simple: false,
      // headers: {
      //   Cookie: config.sync.cookieKey + "=" + connectId
      // },
      json: false,
      jar: true,
      resolveWithFullResponse: true // https://github.com/request/request-promise#get-the-full-response-instead-of-just-the-body
    });

    if (res.headers["content-disposition"].substring(0, 10) === "attachment") {
      // Vérifie que la réponse est un attachement
      process.stdout.write("OK\n");
      return res.body; // Données csv. TODO: convertir en utf-8
    } else {
      throw "";
    }
  } catch (e) {
    process.stdout.write("Echec\n");
    throw "";
  }
}



/* calcDateFrom
 * Actuellement, on considère que la date de début de requête doit être la date des dernières données disponibles.
 * (Cela implique que les données de la date en question seront à nouveau requêtées et potentiellement intégrées à la mise à jour.)
 * @param seancesData {Object}: données JSON de séances.
 * @return {Object moment} : date de la séance la plus récente.
 */
function calcDateFrom(seancesData) {
  return moment.max(
    _(seancesData)
    .map(d => moment(d.date))
    .value()
  );
}

/**
 * _csvToJson
 * Convertit une chaîne CSV en objet JSON.
 * @param csv {String} : chaîne de données au format CSV.
 * @param headers {Array: String} : tableau des noms d'en-têtes de colonnes.
 * @return {Object} : Données JSON.
 */
function _csvToJson(csv, headers) {
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
 * aggregateTicketsToSeances
 * @param data { Array: Object }: données JSON de tickets.
 * @return {Array: Object}: données JSON de séances.
 * @todo documentation
 */
function aggregateTicketsToSeances(data) {
  return _(data)
    .groupBy(d => d.idTicket) // Dédoublonnage des séances sur idTicket
    .mapValues(d => d[0])
    .map(function (item) {
      return _.assign({}, item, {
        montant: parseFloat((item.montant || "0").replace(",", "."))
      });
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
          tarif: _(items)
            .groupBy("tarif")
            .mapValues(item => item.length)
            .value(),
          web: _(items)
            .filter(function (item) {
              return _.indexOf(config.codesCanalWeb, item.idCanal) > -1;
            })
            .value().length // Codes canal de vente web
        }
      };
    })
    .filter(function (d) {
      return !_.isUndefined(d.salle);
    }) // Retire les items hors salle de cinéma
    .sortBy("date")
    .value();
}

/**
 * splitSeances
 * Divise une collection de séances en deux collections suivant la date/heure actuelle
 * @param seances { Object } :  collection de séances
 * @param offset { Number } : durée (en minute) à attendre après l'heure de la séance pour la considérer comme passée
 * @return { Array } : [séances passées, séances futures]
 */
function splitSeances(seances, offset) {
  offset = offset || 10;
  return _(seances)
    .partition(d =>
      moment(d.date).isBefore(moment().subtract(offset, "minutes"), "minutes")
    )
    .value();
}

/**
 * mergeSeances
 * Fusionne un tableau de séances (initial) avec un tableau de séances supplémentaires (ajouts).
 * En cas de collision, les séances ajoutées sont prioritaires.
 * Cette fonction sert à mettre à jour les séances passées existantes avec les séances passées nouvelle obtenues.
 * @param {Object} seances : collection de séances.
 * @param {Object} added : collection de séances.
 */
function mergeSeances(seances, added) {
  return _(seances)
    .concat(added)
    .groupBy("idSeance")
    .map(_.last)
    .sortBy("date")
    .value();
}

/**
 * readJsonFile
 * Fonction générique de lecture de fichier JSON encodé en utf-8.
 * @param path {String}: chemin d'accès.
 * @return {Promise: Object}: données JSON parsées.
 */
function readJsonFile(path) {
  return new Promise((resolve, reject) => {
    return fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

/**
 * writeJsonFile
 * Fonction générique d'écriture de fichier JSON encodé en utf-8.
 * @param path {String}: chemin d'accès.
 * @return {Promise: Object}: données JSON parsées.
 */
function writeJsonFile(path, data) {
  return new Promise((resolve, reject) => {
    return fs.writeFile(path, JSON.stringify(data, null, 2), "utf8", err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  query: query,
  past: past,
  future: future
};