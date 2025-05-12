const mysql = require("mysql2");
const util = require("util");
require('dotenv').config();


const { DBHOST, DBUSER, DBPASSWORD, DBNAME, DBPORT } = process.env;

const pool = mysql.createPool({
  host: DBHOST,
  user: DBUSER,
  password: DBPASSWORD,
  database: DBNAME,
  port: DBPORT,
});

pool.query = util.promisify(pool.query).bind(pool);

module.exports = pool;
