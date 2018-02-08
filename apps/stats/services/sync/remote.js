const request = require("request-promise"); // https://github.com/request/request-promise
const config = require("./config.js");

module.exports = {
  connect: connect,
  query: query
};

/**
 * Connect
 * Tente une connexion/authentification sur le serveur distant et renvoie l'ID de connexion en cas de réussite
 * @param {string} url
 * @param {string} login
 * @param {string} password
 * @return {Promise} ID de connexion
 * @date 2017-06-13
 * @date 2018-02-07 : utilise async/await
 */
async function connect (url, login, password) {
  process.stdout.write("Connexion au serveur : ");
  try {
    var res = await request({
      method: "POST",
      uri: url,
      followRedirect: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "login=" + login + "&motPasse=" + password + "&Submit=Valider",
      simple: false,
      resolveWithFullResponse: true // https://github.com/request/request-promise#get-the-full-response-instead-of-just-the-body
    });
    var connectId = res.headers.location.match(/sid=([a-z\d]+)$/)[1]; 
    process.stdout.write(`OK\n${ connectId }\n`);
    return connectId;
  } catch (e) {
    process.stdout.write("Echec\n");
    throw("");
  }
}

/**
 * Query
 * Fait une requête
 * @param queryUrl {string} URL de la requête
 * @param requestBody {string} Corps de la requête (à construite à partir de templates présents dans le fichier config)
 * @return {string} Chaîne de type csv
 * @date 2017-06-13 : version initiale
 * @date 2018-02-07 : utilise async/await
 * @todo Convertir la réponse en utf8
 */
async function query (connectId, requestBody) {
  var sessionId;
  var res;

  // Obtention de l'id de session
  process.stdout.write("Envoi de la requête : ");
  try {
    sessionId = (await request({
      method: "POST",
      uri: config.queryUrl,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": config.cookieKey + "=" + connectId
      },
      json: true,
      body: requestBody
    }))
    .data.sessionId;
    process.stdout.write(`OK\n${ sessionId }\n`);
  } catch (e) {
    process.stdout.write("Echec\n");
    throw("");
  }

  // Récupération des données
  process.stdout.write("Récupération des données : ");
  try {
    res = await request({
      method: "GET",
      uri: config.queryUrl + "&op=dl&format=csv&id=" + sessionId,
      headers: {
        "Cookie": config.cookieKey + "=" + connectId
      },
      json: false,
      resolveWithFullResponse: true // https://github.com/request/request-promise#get-the-full-response-instead-of-just-the-body
    });

    if (res.headers["content-disposition"].substring(0, 10) === "attachment") { // Vérifie que la réponse est un attachement
        process.stdout.write("OK\n");
        return res.body; // TODO: convertir en utf8
    } else {
      throw("");
    }
  } catch (e) {
    process.stdout.write("Echec\n");
    throw("");
  }
}