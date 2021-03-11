const _ = require("lodash");

/**
 * dropNullProperties
 * @summary Returns a copy of the input object (or array of objects) without the `null`-valued properties. This is useful to clean-up rows read from a database.
 * If the input is an array, processes each element
 * @example { title: "Blow Up", art: null } => { title: "Blow Up" }
 * @todo lodash/fp version
 * @requires lodash
 * @param o {object|array of objects}
 * @returns {object|array of objects}
 */
function dropNullProperties(a) {
  return _.isArray(a)
    ? _(a)
        .map((b) => dnp(b))
        .value()
    : dnp(a);
  function dnp(o) {
    return _(o)
      .mapValues((v) => (v === null ? undefined : v))
      .value();
  }
}

module.exports = dropNullProperties;
