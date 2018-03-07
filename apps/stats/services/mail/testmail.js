var nodemailer = require("nodemailer");
var smtpConfig = require("../../config").smtp;

// var smtpConfig = {
//   host: "mail.gandi.net",
//   port: 465,
//   secure: true, // use SSL
//   auth: {
//     user: "admin@cnmtq.fr",
//     pass: "z_6SuhoQT7"
//   }
// };

var transporter = nodemailer.createTransport(smtpConfig);

var mailOptions = {
  from: '"Admin" <admin@cnmtq.fr>',
  to: "nlte@magic.fr",
  subject: "Hello ✔",
  text: "Hello world?",
  html: "<strong>Hello world?</strong>"
};


module.exports = function () {
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function (error, info) {
    if(error){
      return console.log(error);
    }
    console.log("Message sent: " + info.response);
  });
};


