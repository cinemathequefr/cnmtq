const _ = require("lodash");
const fs = require("fs");
const moment = require("moment");
const csvtojson = require("csvtojson"); // https://github.com/Keyang/node-csvtojson
const config = require("./config");
const remote = require("./remote");
const utils = require("./utils");



(async function () {
  // console.log(await utils.dateLastSeancesAvailable().catch(e => { console.log(e); }));
  console.log(await utils.calcDateFrom());
  // console.log(await sync());
})();


// module.exports = sync;

  
async function sync () {
  var connectId;
  var csv;
  var json;
  var data;

  // Pour test
  var dateSpan = {
    dateFrom: "2018-01-01",
    dateTo: "2018-02-05"
  };



  try {
    connectId = await remote.connect(config.connectUrl, config.login, config.password);
    csv = await remote.query(connectId, _.template(config.requestTemplates.tickets)(dateSpan));
    json = await toJson(csv, "tickets");
    data = utils.aggregateTicketsToSeances(json);

    return new Promise((resolve, reject) => {
      process.stdout.write("Ecriture du fichier: ");
      fs.writeFile(
        config.path.seances,
        // __dirname + "/../../data/test.json",
        JSON.stringify(data),
        "utf8",
        (err) => {
          if (err) {
            process.stdout.write("Erreur\n");
          } else {
            process.stdout.write("OK\n");
            resolve(data);
          }
        }
      );
    });
  } catch (e) {
    console.log(e);
  }

}



/**
 * toJson
 * Convertit une chaîne CSV en JSON
 * @param {string} csv : chaîne de données au format CSV
 * @param {string} tableName : (ex. "tickets") nom de la table de données
 * @return {string} json
 * @todo : passer les headers en paramètres
 */
function toJson (csv, tableName) {
 return new Promise((resolve, reject) => {
    var o = [];
    csvtojson({
      delimiter: ";",
      toArrayString: true,
      noheader: false,
      checkType: true, // Type inference
      headers: config.jsonHeaders[tableName]
    })
    .fromString(csv)
    .on("json", row => o.push(row))
    .on("error", err => reject(err))
    .on("done", () => resolve(o));
  });
}
