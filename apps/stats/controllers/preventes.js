const _ = require("lodash");
const moment = require("moment");
const dbFuture = require("../services/db")("future");
const config = require("../config");
const extendDataForViews = require("../lib/extendDataForViews");
const sync = require("../services/sync");

module.exports = async function (ctx, next) {
  var data;

  if (ctx.isAuthenticated() === false) {
    ctx.status = 401;
    return;
  }

  ctx.type = "text/html; charset=utf-8";

  try {
    var nxt = nextSyncAllowed();
    if (nxt.status === true) {
      try {
        await sync.future();
      } catch (e) {
        console.log("La synchronisation a échoué.");
      }
    }
    data = dbFuture.getState();
    return ctx.render("preventes", extendDataForViews(data, {
      nextSync: nxt
    }));
  } catch (e) {
    console.log(e);
  }
};

/*
 * nextSyncAllowed
 * A partir la date/heure de la dernière synchro (inscrite en clé de l'objet dbFuture) et du délai de throttling
 * renvoie la date/heure de la prochaine synchro possible et indique si elle est déjà passée.
 * @return {object}.status {boolean} : true: la synchro est possible
 * @return {object}.dateTime {string|null} : si status:false, date/heure de la prochaine synchro
 */
function nextSyncAllowed() {
  var nextSyncDateTime = moment(
    _(dbFuture.getState())
    .keys()
    .value()[0]
  ).add(config.sync.syncThrottleMinutes, "minutes");

  var status = moment().isAfter(nextSyncDateTime, "second");
  var dateTime = status === false ? nextSyncDateTime.format() : null;

  return {
    status: status,
    dateTime: dateTime
  };
}