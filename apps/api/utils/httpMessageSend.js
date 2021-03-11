const { httpMessage } = require("../config");

/**
 * httpMessageSend
 * Looks up and send a standardized response JSON object - when there is not actual content to be sent.
 * Mainly used for errors. The messages are listed in config.httpMessage.
 * @param {string} msg Message (error or not) identifier (eg "User not found")
 * @param {object} ctx Koa ctx object
 */
function httpMessageSend(msg, ctx) {
  let res, success;
  let status = 500; // Default ?

  if (typeof httpMessage[msg] === "object") {
    status = Number(httpMessage[msg].status);
    // status = httpMessage[msg].status;
    success = status < 400;
    res = Object.assign(httpMessage[msg], { message: msg, success });
  } else if (typeof res === "object") {
    // Probably an error object
    res = msg;
  } else {
    res = { status: 500, message: `Unknown response (${msg})` };
    // msg = { status: 500, message: `Unknown response (${msg})` };
  }
  ctx.type = "json";
  ctx.status = status;
  ctx.body = JSON.stringify(res, Object.getOwnPropertyNames(res)); // https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
}

module.exports = httpMessageSend;
