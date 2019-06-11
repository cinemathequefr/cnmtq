/**
 * Script CLI pour envoyer un rapport quotidien par mail
 * node mail {date} {toAll}
 * @param {string} date Date ISO du rapport à envoyer
 * @param {string} "--all" : si ce flag est présent, envoyer à tous les destinataires listés (sinon seulement à l'adresse de test)
 */
const moment = require("moment");
const config = require("../config");
const mailReport = require("../controllers/mail-report.js");
const _ = require("lodash");

moment.updateLocale("fr", config.momentLocaleFr);

(async function () {
  let date = process.argv[2]; // Date du rapport à envoyer
  let toAll = process.argv[3] === "--all";

  let recipients = toAll ? config.mail.recipients : {
    to: ["n.lethierry@cinematheque.fr"]
  };

  let count = _(recipients)
    .map(d =>
      d ? d.length : 0
    )
    .sum();

  try {
    if (!date) throw ("La date du rapport n'a pas été indiquée.");

    await mailReport.daily(
      moment(date).format("YYYY-MM-DD"),
      recipients
    );
    console.log(`Rapport du ${date} envoyé à ${count} destinataires.`);
  } catch (e) {
    console.log("Une erreur s'est produite.");
    console.log(e);
  }
})();