const _ = require("lodash");
const moment = require("moment");
const request = require("request-promise"); // https://github.com/request/request-promise
const csvtojson = require("csvtojson"); // https://github.com/Keyang/node-csvtojson
const fs = require("fs");
const config = require("../../config");
const db = require("../db")("seances");
// const db = require("../db");

module.exports = {
  run: run
};

/**
 * run
 * Effectue une synchronisation des données de séances :
 * - Détermine la période de requête
 * - Effectue la requête distante
 * - Transforme les données (tickets -> séances)
 * - Sérialise la mise à jour (fichier JSON)
 * @return { Promise }
 * @TODO utiliser le fichier de config pour indiquer le chemin du fichier JSON de données.
 */
async function run () {
  var connectId;
  var fetchedTicketsCsv;
  var fetchedTicketsJson;
  var fetchedSeancesData;
  var fetchedSeancesDataSplit; // Données de séances obtenues de la requête distante et séparées en passées et futures
  var existingSeancesData; // Données de séances existantes (= fichier) (passées et futures: [[], []])
  var updatedSeancesData;
  var dateFrom, dateTo;
  var currentDate = moment().startOf("day"); // On capture la date courante

  return new Promise(async function (resolve, reject) {
    try {
      existingSeancesData = await Promise.all([
        readJsonFile(__dirname + "/../../data/seances.json"), // données passées
        [] // TODO: données futures
      ]);

      dateFrom = calcDateFrom(existingSeancesData[0]).format("YYYY-MM-DD");
      dateTo = currentDate.clone().add(config.sync.lookAheadDays, "days").format("YYYY-MM-DD"); // 2018-03-06 : on prend pour date de fin de requête la date du jour (+ lookAheadDays)
      connectId = await connect(config.sync.connectUrl, config.sync.login, config.sync.password);
      fetchedTicketsCsv = await query(connectId, _.template(config.sync.requestTemplates.tickets)({ dateFrom: dateFrom, dateTo: dateTo }));
      fetchedTicketsJson = await _csvToJson(fetchedTicketsCsv, config.sync.jsonHeaders["tickets"]);
      fetchedSeancesData = aggregateTicketsToSeances(fetchedTicketsJson);
      fetchedSeancesDataSplit = splitSeances(fetchedSeancesData); // => [[passées], [futures]]
      updatedSeancesData = mergeSeances(existingSeancesData[0], fetchedSeancesDataSplit[0]);

      await writeJsonFile(
        __dirname + "/../../data/seances.json",
        updatedSeancesData
      );

      db.setState(updatedSeancesData); // Update data in lowdb (https://github.com/typicode/lowdb)

      console.log(`Synchronisation à ${ moment().format() } : ${ fetchedSeancesDataSplit[0].length } séances ajoutées.`);
      resolve();

    } catch (e) {
      reject(e);
    }
  });
}


/**
 * connect
 * Tente une connexion/authentification sur le serveur distant et renvoie l'ID de connexion en cas de réussite
 * @param url { String }
 * @param login { String }
 * @param password { String }
 * @return ID de connexion { Promise }
 * @date 2017-06-13
 * @date 2018-02-07 : utilise async/await
 */
async function connect (url, login, password) {
  process.stdout.write("Connexion au serveur : ");
  try {
    var res = await request({
      method: "POST",
      uri: url,
      followRedirect: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "login=" + login + "&motPasse=" + password + "&Submit=Valider",
      simple: false,
      resolveWithFullResponse: true // https://github.com/request/request-promise#get-the-full-response-instead-of-just-the-body
    });
    var connectId = res.headers.location.match(/sid=([a-z\d]+)$/)[1]; 
    process.stdout.write(`OK\n${ connectId }\n`);
    return connectId;
  } catch (e) {
    process.stdout.write("Echec\n");
    throw("");
  }
}


/**
 * query
 * Fait une requête distante
 * @param queryUrl {String} URL de la requête
 * @param requestBody {String} Corps de la requête (à construite à partir de templates présents dans le fichier config)
 * @return {String} Chaîne de type csv
 * @date 2017-06-13 : version initiale
 * @date 2018-02-07 : utilise async/await
 * @todo Convertir la réponse en utf8
 */
async function query (connectId, requestBody) {
  var sessionId;
  var res;

  // Obtention de l'id de session
  process.stdout.write("Envoi de la requête : ");
  try {
    sessionId = (await request({
      method: "POST",
      uri: config.sync.queryUrl,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": config.sync.cookieKey + "=" + connectId
      },
      json: true,
      body: requestBody
    }))
    .data.sessionId;
    process.stdout.write(`OK\n${ sessionId }\n`);
  } catch (e) {
    process.stdout.write("Echec\n");
    throw("");
  }

  // Récupération des données
  process.stdout.write("Récupération des données : ");
  try {
    res = await request({
      method: "GET",
      uri: config.sync.queryUrl + "&op=dl&format=csv&id=" + sessionId,
      headers: {
        "Cookie": config.sync.cookieKey + "=" + connectId
      },
      json: false,
      resolveWithFullResponse: true // https://github.com/request/request-promise#get-the-full-response-instead-of-just-the-body
    });

    if (res.headers["content-disposition"].substring(0, 10) === "attachment") { // Vérifie que la réponse est un attachement
        process.stdout.write("OK\n");
        return res.body; // TODO: convertir en utf8
    } else {
      throw("");
    }
  } catch (e) {
    process.stdout.write("Echec\n");
    throw("");
  }
}


/* calcDateFrom
 * Actuellement, on considère que la date de début de requête doit être la date des dernières données disponibles.
 * (Cela implique que les données de la date en question seront à nouveau requêtées et potentiellement intégrées à la mise à jour.
 * @param seancesData {Object}: données JSON de séances.
 * @return {Object moment} : date de la séance la plus récente.
 */
function calcDateFrom (seancesData) {
  return moment.max(_(seancesData).map(d => moment(d.date)).value());
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
 * aggregateTicketsToSeances
 * @param data { Array: Object }: données JSON de tickets.
 * @return {Array: Object}: données JSON de séances.
 * @todo documentation
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


/**
 * splitSeances
 * Divise une collection de séances en deux collections suivant la date/heure actuelle
 * @param seances { Object } :  collection de séances
 * @param offset { Number } : durée (en minute) à attendre après l'heure de la séance pour la considérer comme passée
 * @return { Array } : [séances passées, séances futures]
 */
function splitSeances (seances, offset) {
  offset = offset || 10;
  return _(seances).partition(d =>
    moment(d.date)
    .isBefore(
      moment().subtract(offset, "minutes"),
      "minutes"
    )
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