const sync = require("../services/sync");

(async () => {
  await sync.run();
  console.log("Finished");
})();

