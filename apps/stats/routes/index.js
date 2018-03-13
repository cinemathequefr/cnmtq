const Router = require("koa-router");
const moment = require("moment");
const _ = require("lodash");
const format = require("number-format.js");
const queries = require("../db/queries");
const config = require("../config");
const sync = require("../services/sync");

const testmail = require("../services/mail"); // TEST
const router = new Router();

moment.locale("fr", config.momentLocaleFr);

router.redirect("/day", `/day/${ queries.lastDate() }`);


// router.get("/day", async function (ctx, next) {
//   console.log(queries.lastDate());
//   return;
// });

router.get("/day/:date", async function (ctx, next) {
  ctx.type = "text/html; charset=utf-8";
  try {
    var data;
    var queryDate = ctx.params.date;

 
    if (moment(queryDate, "YYYY-MM-DD", true).isValid() === false) { // https://stackoverflow.com/questions/43101278/how-to-handle-deprecation-warning-in-momentjs
      queryDate = queries.lastDate();
      ctx.redirect(`/day/${ queryDate }`);
    }

    // queryDate = moment(queryDate).format("YYYY-MM-DD");

    data = queries.day(queryDate);

    return ctx.render("day",
      {
        date: queryDate,
        moment: moment,
        format: format,
        data: _(data)
          .reject({ exclude: true }) // TODO: en principe, inutile.
          .map(d =>
            _(d).assign({
              tickets: _(d.tickets).assign({ tarifCat2: tarifCat(d.tickets.tarif, config.tarifCats) }).value()
            })
            .value())
          .value()
      }
    );
  } catch (err) {
    console.log(err);
    return;
  }
});

router.get("/sync", async function (ctx, next) {
  await sync();
  ctx.body = {
    status: "success",
    message: "Sychro OK"
  };
});


router.get("/testmail", async function (ctx, next) {
  testmail();
});




/** 
 * tarifCat
 * A partir du nombres de billets vendus par code tarifaire et d'une liste de catégories des codes tarifaires, on obtient le nombre de billets vendus par catégorie.
 * L'ordre de sortie suit l'ordre d'énumération des catégories tarifaires (`cats`).
 * @param tarif {Object} {"code1": compte1, "code2": compte2, ...}
 * @param cats {Array} [["cat1": [code1, code2, code3, ...]], ["cat2": [code4, code5, ...]], ...]
 * @return {Array} [["cat1": compte1], ["cat2": compte2], ...]
 * @TODO : déplacer dans utils
 */
function tarifCat (tarif, cats) {
  return _(
    _(tarif).map((v, k) => {
      return _.fromPairs([[
        _(_.fromPairs(cats)).findKey(c => _.indexOf(c, parseInt(k, 10)) > -1) || "Autres",
        v
      ]]);
    })
    .reduce((acc, item) => {
      return _({}).assignWith(acc, item, (a, b) => _.sum([a, b])).value();
    })
  )
  .toPairs()
  .sortBy(d => {
    return _(cats).map((e, i) => [e[0], i]).fromPairs().value()[d[0]];
  })
  .value();
}

module.exports = router;