const httpMessageSend = require("./utils/httpMessageSend.js");
const services = require("./services");

module.exports = function (object, action) {
  return async (ctx, next) => {
    let res;
    try {
      res = await services[object][action](
        ctx.params,
        Object.assign(ctx.request.body, ctx.request.query) // Merges request body and querystring.
      );

      // Important: by convention, an object will be used as the reponse body (always with status 200?), whereas a string will be treated as a message to be processed by httpMessageSend.
      if (typeof res === "object") {
        ctx.type = "json";
        ctx.status = 200;
        ctx.body = res;
      } else {
        httpMessageSend(res, ctx);
      }
    } catch (error) {
      httpMessageSend(error, ctx);
    }
  };
};
