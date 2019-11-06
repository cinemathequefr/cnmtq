const sync = require("../services/sync");
(async () => {
  let date = process.argv[2]; // Date de la synchro a effectuer
  if (!date) {
    try {
      // await sync.future();
      await sync.past();
      console.log("Finished");
    } catch (e) {
      console.log(e);
    }
  } else {
    try {
      await sync.query(date, date);
      console.log("Finished");
    } catch (e) {
      console.log(e);
    }
  }
})();