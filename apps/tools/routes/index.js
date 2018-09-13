const Router = require("koa-router");
const _ = require("lodash");
const controllers = require("../controllers");

const router = new Router();

router.redirect("/", "/calendar");
router.get("/calendar", controllers.calendar);

module.exports = router;