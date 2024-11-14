const db=require('../db')

const get = async (req, res) => {
    console.log("called");
    const { tableName } = req.body;
  
    // Validate and sanitize tableName
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).send("Invalid table name");
    }
  
    let sql_query = `SELECT * FROM ??`;
    await db.query(sql_query, [tableName], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database query failed");
      }
      res.send(result);
      // console.log(result);
    });
  };

  exports.get=get;