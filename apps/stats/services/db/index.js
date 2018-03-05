const low = require("lowdb"); // https://github.com/typicode/lowdb
const FileSync = require("lowdb/adapters/FileSync");
const utils = require("../../utils");

const adapter = new FileSync(`${ __dirname }/../../data/seances.json`);
const db = low(adapter);

// var exclude;
// (async function () {
//   try {
//     exclude = await utils.readJsonFile(`${ __dirname }/../../data/exclude-seances.json`);
//   } catch (e) {
//     console.log(e);
//   }
// })();
// db.setState(utils.excludeSeances(db.getState(), exclude));
// console.log(db.filter({ idSeance: 4926381 }).value());

module.exports = db;