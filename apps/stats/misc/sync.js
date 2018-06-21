const sync = require("../services/sync");

// (async () => {
//   var d = await sync.past();
//   console.log("Finished");
// })();

(async () => {
  var d = await sync.future();
  console.log("Finished");
})();

// (async () => {
//   await sync.run();
//   console.log("Finished");
// })();

