const mysql = require("mysql2/promise");
require('dotenv').config();


const { DBHOST, DBUSER, DBPASSWORD, DBNAME, DBPORT } = process.env;

const pool = mysql.createPool({
  host: DBHOST,
  user: DBUSER,
  password: DBPASSWORD,
  database: DBNAME,
  port: DBPORT,
});



module.exports = pool;
