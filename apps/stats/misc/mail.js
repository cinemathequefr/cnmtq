// const mail = require("../services/mail");
const mailReport = require("../controllers/mail-report.js");

(async function() {






  await mailReport.daily("2018-06-20", { to: ["n.lethierry@cinematheque.fr"] });
  await mailReport.daily("2018-06-21", { to: ["n.lethierry@cinematheque.fr"] });
  await mailReport.daily("2018-06-22", { to: ["n.lethierry@cinematheque.fr"] });
  await mailReport.daily("2018-06-23", { to: ["n.lethierry@cinematheque.fr"] });
  await mailReport.daily("2018-06-24", { to: ["n.lethierry@cinematheque.fr"] });

  // console.log(
  //   await mail.send("Test", "Hello world", "<h1>Hello world</h1>", {
  //     to: ["n.lethierry@cinematheque.fr", "nicolas.lethierry@gmail.com"]
  //   })
  // );
})();