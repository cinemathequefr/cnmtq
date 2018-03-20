const nodemailer = require("nodemailer");
const config = require("../../config");

// Configuration du transport
const transporter = nodemailer.createTransport(config.mail.smtp);

/**
 * send
 * Envoie un e-mail
 * @param subject { String } Sujet du message
 * @param plainText { String } Message au format texte brut
 * @param html { String } Message au format HTML
 * @param recipients { Object: Array: String } Liste des adresses e-mail des destinataires, en valeur des clés `to` et `bcc`.
 * @return { Promise }
 */
function send (subject, plainText, html, recipients) {
  plainText = plainText || "";
  html = html || "";
  return new Promise((resolve, reject) => {
    transporter.sendMail({
      from: config.mailsender,
      to: recipients.to,
      bcc: recipients.bcc,
      subject: subject,
      text: plainText,
      html: html
    }, function (error, info) {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
}

module.exports = {
  send: send
};