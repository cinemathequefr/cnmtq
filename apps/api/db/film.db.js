const { flow, mapValues, pick, toPairs, unzip } = require("lodash/fp");
const _ = require("lodash");
const db = require("./db-conn");
const format = require("pg-format");

const { dropNullProperties } = require("../utils");

const filmColumns = [
  "pk",
  "titre",
  "art",
  "titrevo",
  "artvo",
  "titrenx",
  "realisateurs",
  "annee",
  "pays",
  // "adaptation", // TODO: column must be added in the table
  "generique",
  "synopsis",
  "commentaire",
  "mentions",
  "ageminimal",
];

// TODO: are there some parts (business logic and database query logic?) that should be moved to "services" ? This needs clarification.
module.exports = {
  create: async (o) => {
    try {
      o = pick(filmColumns)(o);
      o = mapValues((d) => (d === "" ? null : d))(o); // An empty string is replaced by null
      o = toPairs(o);
      o = unzip(o);

      let query = format(`INSERT INTO films(%I) VALUES(%L);`, o[0], o[1]);
      await db.query(query);
      return;
    } catch (e) {
      throw e;
    }
  },

  update: async (id, o) => {
    let res;
    try {
      o = pick(filmColumns)(o); // TODO? Remove "pk" (not updated)
      o = mapValues((d) => (d === "" ? null : d))(o); // An empty string is replaced by null
      o = toPairs(o);
      o = unzip(o);

      // TODO: write a function to do this (safe sql string for "column1=val1, column2=val, etc.")
      let a = [];
      for (let i = 0; i < o[0].length; i++) {
        a.push(`${format("%I", o[0][i])}=${format("%L", o[1][i])}`);
      }
      a = a.join(", ");
      let query = `UPDATE films SET ${a} WHERE pk=${id};`;

      await db.query(query);
      // if (res.rowCount !== 1) throw "Unspecified error"; // Shouldn't happen.
      return;
    } catch (e) {
      throw e;
    }
  },

  delete: async (id) => {
    try {
      // BEWARE: in our use case, deletion should be allowed only under very special circumstances.
      await db.query(`DELETE FROM films WHERE pk=$1;`, [id]);
      if (res.rowCount === 0) throw "Resource not found";
      return; // We don't return anything.
    } catch (e) {
      throw e;
    }
  },
  getAll: async (q) => {
    let count, res;
    let query;
    try {
      // TODO: paginate with LIMIT/OFFSET clauses.
      // res = await db.query(`SELECT * FROM films ORDER BY titre LIMIT 100 OFFSET 0;`);

      if (!q) {
        query = format(`SELECT %I FROM films ORDER BY titre;`, filmColumns);
        res = await db.query(query);
      } else {
        query = format(
          `SELECT %I FROM films WHERE titre ILIKE '%' || $1 || '%' ORDER BY titre;`, // Sans `unaccent` pour compatibilité psql 9.4
          // `SELECT %I FROM films WHERE unaccent(titre) ILIKE unaccent('%' || $1 || '%') ORDER BY titre;`, // https://stackoverflow.com/a/19472095/494979
          filmColumns
        );
        res = await db.query(query, [q]); //
      }

      return {
        totalItems: res.rowCount,
        data: dropNullProperties(res.rows),
      };
    } catch (e) {
      throw e;
    }
  },
  get: async (id) => {
    let res;
    try {
      let query = format(`SELECT %I FROM films WHERE pk=$1;`, filmColumns);
      res = await db.query(query, [id]);
      if (res.rowCount === 0) throw "Resource not found";
      return dropNullProperties(res.rows[0]);
    } catch (e) {
      throw e;
    }
  },
};
