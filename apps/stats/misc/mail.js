const mail = require("../services/mail");

(async function () {
  console.log(
    await mail.send("Test", "Hello world", "<h1>Hello world</h1>", { to: ["n.lethierry@cinematheque.fr", "nicolas.lethierry@gmail.com"] })
  );
})(); 