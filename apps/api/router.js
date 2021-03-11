const Router = require("@koa/router");
const jwt = require("koa-jwt");
const { secret } = require("./config.js");
const controller = require("./controller.js");

const router = new Router();

// const protect = () => jwt({ secret, passthrough: true }); // TEST
const protect = () => jwt({ secret, passthrough: false });

router.post("/login", controller("user", "login"));
router.post("/user", protect(), controller("user", "register"));
router.get("/films", protect(), controller("film", "getAll"));
router.get("/film/:id", protect(), controller("film", "get"));
router.post("/film", protect(), controller("film", "create"));
router.put("/film/:id", protect(), controller("film", "update"));
router.delete("/film/:id", protect(), controller("film", "delete"));
router.get(/^\/.*$/gi, (ctx) => {
  ctx.body = { message: "Not found" };
  ctx.status = 404;
});

module.exports = router;
