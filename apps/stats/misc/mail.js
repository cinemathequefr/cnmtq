// const mail = require("../services/mail");
const mailReport = require("../controllers/mail-report.js");

(async function() {
  mailReport.daily("2018-06-23", { to: ["n.lethierry@cinematheque.fr"] });
  // console.log(
  //   await mail.send("Test", "Hello world", "<h1>Hello world</h1>", {
  //     to: ["n.lethierry@cinematheque.fr", "nicolas.lethierry@gmail.com"]
  //   })
  // );
})();