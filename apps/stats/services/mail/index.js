const nodemailer = require("nodemailer");
const config = require("../../config");
const _ = require("lodash");
const moment = require("moment");

const transporter = nodemailer.createTransport(config.smtp);

// const mailOptions = {
//   from: '"Stats" <stats@cnmtq.fr>',
//   to: config.recipients,
//   subject: "Séances du dimanche 4 mars 2018",
//   text: "Dimanche 4 mars 2018\nCeci est un message automatique.",
//   html: "<h1>Dimanche 4 mars 2018</h1><p>Ceci est un message automatique.</p><table><tr><td>Le Dernier empereur</td><td>97</td></tr><tr><td>Coup de cœur</td><td>186</td></tr></table>"
// };


function send (subject, html, recipients) {
  return new Promise((resolve, reject) => {
    transporter.sendMail({
      from: '"Stats" <stats@cnmtq.fr>',
      to: recipients,
      subject: subject,
      html: html
    }, function (error, info) {
      if (error) {
        reject("Erreur d'envoi.");
      } else {
        resolve(`Message sent: ${ info.response }`);
      }
    });
  });
}


module.exports = {
  send: send
};





// module.exports = function () {

//   var mailData = _({}).assign(mailOptions, {

//   }).value();




//   transporter.sendMail(mailOptions, function (error, info) {
//     if (error){
//       return console.log(error);
//     }
//     console.log("Message sent: " + info.response);
//   });
// };
