const sync = require("../services/sync");

(async () => {

  let date = process.argv[2]; // Date de la synchro a effectuer

  if (!date) {
    await sync.past();
    console.log("Finished");
  } else {

    console.log(JSON.stringify(await sync.query(date, date), null, 2));



  }

})();

// (async () => {
//   var d = await sync.future();
//   console.log("Finished");
// })();

// (async () => {
//   await sync.run();
//   console.log("Finished");
// })();