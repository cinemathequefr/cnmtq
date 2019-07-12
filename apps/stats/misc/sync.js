const sync = require("../services/sync");
(async () => {
  let date = process.argv[2]; // Date de la synchro a effectuer
  if (!date) {
    await sync.past();
    // await sync.future();
    console.log("Finished");
  } else {
    console.log(JSON.stringify(await sync.query(date, date), null, 2));
  }
})();