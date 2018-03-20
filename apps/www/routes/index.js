const Router = require("koa-router");
const _ = require("lodash");
const controllers = require("../controllers");

const router = new Router();

router.get("/", controllers.homepage);

module.exports = router;