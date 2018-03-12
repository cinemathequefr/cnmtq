const _ = require("lodash");
const fs = require("fs");
const moment = require("moment");
const config = require("../../config");
const utils = require("../../utils");
const db = require("../db");
const remote = require("./remote");


// const consolidate = require("consolidate");
// const mail = require("./mail");





/*
(async function () {
  await sync();
})();
*/

module.exports = sync;

  
/**
 * sync
 * Met à jour les données de séances avec les données obtenues d'une requête distante
 * Pour le moment, on ne s'occupe que du cas d'une mise à jour simple, et uniquement sur les données passées
 * @param opts {Object} : TODO (permet de spécifier : mise à jour ou récupération forcée de toutes les données historiques ; données passées et/ou futures)
 * @return
 */
async function sync (opts) {
  var connectId;
  var fetchedTicketsCsv;
  var fetchedTicketsJson;
  var fetchedSeancesData;
  var fetchedSeancesDataSplit; // Données de séances obtenues de la requête distante et séparées en passées et futures
  var existingSeancesData; // Données de séances existantes (= fichier) (passées et futures: [[], []])
  var updatedSeancesData;
  var dateFrom, dateTo;
  var currentDate = moment().startOf("day"); // On capture la date courante

  try {
    existingSeancesData = await Promise.all([
      utils.readJsonFile(__dirname + "/../../data/seances.json"), // données passées
      [] // TODO: données futures
    ]);

    dateFrom = utils.calcDateFrom(existingSeancesData[0]).format("YYYY-MM-DD");

    // 2018-03-06 : on prend pour date de fin de requête la date du jour (+ lookAheadDays)
    dateTo = currentDate.clone().add(config.sync.lookAheadDays, "days").format("YYYY-MM-DD");
    // dateTo = currentDate.clone().add(config.sync.lookAheadDays - 1, "days").format("YYYY-MM-DD");

    console.log(dateFrom, dateTo);

    connectId = await remote.connect(config.sync.connectUrl, config.sync.login, config.sync.password);
    fetchedTicketsCsv = await remote.query(connectId, _.template(config.sync.requestTemplates.tickets)({ dateFrom: dateFrom, dateTo: dateTo }));
    fetchedTicketsJson = await utils.csvToJson(fetchedTicketsCsv, config.sync.jsonHeaders["tickets"]);
    fetchedSeancesData = utils.aggregateTicketsToSeances(fetchedTicketsJson);


    fetchedSeancesDataSplit = utils.splitSeances(fetchedSeancesData); // => [[passées], [futures]]

    updatedSeancesData = utils.mergeSeances(existingSeancesData[0], fetchedSeancesDataSplit[0]);

    await utils.writeJsonFile(
      __dirname + "/../../data/seances.json",
      updatedSeancesData
    );

    db.setState(updatedSeancesData); // Update data in lowdb (https://github.com/typicode/lowdb)

    console.log(`Séances passées: ${ fetchedSeancesDataSplit[0].length } séances ajoutées.`);
  } catch (e) {
    console.log(e);
  }
}
