const nodemailer = require("nodemailer");
const config = require("../../config");
const transporter = nodemailer.createTransport(config.mail.smtp);

/**
 * send
 * Envoie un e-mail
 * @param subject {string} Sujet du message
 * @param plainText {string} Message au format texte brut
 * @param html {string} Message au format HTML
 * @param recipients {Object:Array:string} Liste des adresses e-mail des destinataires, en valeur des clés `to` et `bcc`.
 * @return {Promise}
 */
function send(subject, plainText, html, recipients) {
  plainText = plainText || "";
  html = html || "";

  return new Promise((resolve, reject) => {
    transporter.sendMail(
      {
        from: config.mail.sender,
        to: recipients.to,
        bcc: recipients.bcc,
        subject: subject,
        text: plainText,
        html: html
      },
      function(error, info) {
        if (error) {
          reject(error);
        } else {
          console.log("Mail envoyé.");
          console.log(info);
          resolve(info);
        }
      }
    );
  });
}

module.exports = {
  send: send
};