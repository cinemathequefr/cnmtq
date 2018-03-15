const nodemailer = require("nodemailer");
const config = require("../../config");
// const _ = require("lodash");
// const moment = require("moment");

// Configuration du transport 
const transporter = nodemailer.createTransport(config.smtp);

/**
 * send
 * Envoie un e-mail
 * @param subject { String } Sujet du message
 * @param plainText { String } Message au format texte brut
 * @param html { String } Message au format HTML
 * @param recipients { Array: String } Liste des adresses e-mail des destinataires
 * @return { Promise }
 */
function send (subject, plainText, html, recipients) {
  plainText = plainText || "";
  html = html || "";
  return new Promise((resolve, reject) => {
    transporter.sendMail({
      from: config.sender,
      to: recipients,
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