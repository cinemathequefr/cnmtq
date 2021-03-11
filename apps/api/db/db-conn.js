const { Pool } = require("pg");
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  client_encoding: "utf8",
});

module.exports = {
  close: () => {
    pool.end();
  },
  query: async (sql, params) => {
    try {
      console.log(sql, params);

      const client = await pool.connect();
      const res = await client.query(sql, params);
      client.release();
      return res;
    } catch (e) {
      console.log(`Postgresql error ${e.code}`);
      client.release();
      throw e;
    }
  },
};
