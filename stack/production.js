const db = require("../db");
const dayjs = require("dayjs");
const { default: LogType } = require("./LogType");


const production_addition = async (req, res) => {
  const { rawData } = req.body;

  try {

    let sql_query = `insert into prod_add (ppid,cpid,quantity,date) values(?,?,?,?)`;
    let query = `Update production_stack set quantity=quantity+? where ppid=? AND cpid=?`;
    await db.query(query, [rawData.value, rawData.product, rawData.type]);
    await db.query(
      sql_query,
      [
        rawData.product,
        rawData.type,
        rawData.value,
        dayjs(rawData.date).format("YYYY-MM-DD hh:mm:ss"),
      ],
      (err, result) => {
        if (err) throw err;
        res.status(200).send(result);
      }
    );
  } catch (err) {
    res.status(500).send("Internal Error!");
  }
};

const production_grinding = async (req, res) => {

  const { grindData } = req.body;
  const karupatti = grindData?.karupatti || 0;
  const date = dayjs(grindData.date).format("YYYY-MM-DD hh:mm:ss");
  let sql_query = `select quantity from production_stack where cpid=? AND ppid=3`;

  
  const result = await db.query(sql_query, [grindData.oilType]);
  console.log(typeof result[0].quantity +" "+typeof grindData.used)
  if (result.length > 0 && Number(result[0].quantity) < Number(grindData.used)) {
    res.status(400).send("No Stack Raw Available!");
    return;
  }
  if (grindData.oilType === 1 && "karupatti" in grindData) {
    sql_query = "select quantity from production_stack where cpid=1 AND ppid=4";
    const karupattiResult = await db.query(sql_query);
    if (
      karupattiResult.length > 0 &&
      Number(karupattiResult[0].quantity) < Number(grindData.karupatti)
    ) {
      res.status(400).send("No Stack Available For Karupatti!");
      return;
    }
    db.query(
      "update production_stack set quantity=quantity-? where cpid=1 AND ppid=4",
      [grindData.karupatti],
      (err, result1) => {
        if (err) throw err;
      }
    );
  }
  await db.query(
    "update production_stack set quantity=quantity+? where cpid=? AND ppid=1",
    [grindData.producedOil, grindData.oilType]
  );
  await db.query(
    "update production_stack set quantity=quantity+? where cpid=? AND ppid=2",
    [grindData.producedCake, grindData.oilType]
  );
  await db.query(
    "update production_stack set quantity=quantity-? where cpid=? AND ppid=3",
    [grindData.used, grindData.oilType]
  );

  sql_query = `insert into prod_grind (cpid,usedRaw,usedKarupatti,grind,produced_oil,produced_cake,date) values(?,?,?,?,?,?,?)`;

  await db.query(
    sql_query,
    [
      grindData.oilType,
      grindData.used,
      karupatti,
      grindData.grind,
      grindData.producedOil,
      grindData.producedCake,
      date,
    ],
    (err, result) => {
      if (err) throw err;
      res.status(200).send("grind inserted!");
    }
  );
};

const getLog = async (req, res) => {

  const { month, year , type } = req.params;
  console.log(type);
  
 
  const  result = await getProductionLog(month,year);

  return  res.status(200).send(result);
  
};

const getProductionLog = async (month,year)=>{

  const sql_query = "Select * from prod_add where MONTH(date) = ? AND YEAR(date) = ? ";
  const result1 = await db.query(sql_query,[month,year]);
  const query = "select * from prod_grind where MONTH(date) = ? AND YEAR(date) = ? ";
  const result2 = await db.query(query,[month,year]);
  const sq =  "select * from product_transaction_log where MONTH(date) = ? AND YEAR(date) = ?"

  const result3 = await db.query(sq,[month,year]);

  console.log(result1,result2 , month , year);
  const r1 = Array.isArray(result1) ? result1 : [result1];
  const r2 = Array.isArray(result2) ? result2 : [result2];
  const r3 = Array.isArray(result3) ? result3 : [result3];
  const res =  [...r1,...r2,...r3];
  return res;


}


const undo = async (req, res) => {

  const { id, type } = req.body;
  let tableName = type === LogType.ADD ? "prod_add" : type == LogType.GRIND ?"prod_grind":"product_transaction_log"; 
  const result = await db.query(`select * from ${tableName} where id=?`, [id]);
  const object = result[0];
  console.log(object);
  let sql_query = "";


  switch (type) {
    case LogType.ADD:
      sql_query = `update production_stack set quantity = quantity-? where ppid=? AND cpid=?`;
      await db.query(sql_query, [object.quantity, object.ppid, object.cpid]);
      console.log("undo added to stack!");
      break;

    case LogType.GRIND:
      sql_query = `update production_stack set quantity=quantity+? where ppid=? AND cpid=?`;
      await db.query(sql_query, [object.usedRaw, 3, object.cpid]);
      if ("usedKarupatti" in object && object.usedKarupatti != null)
        await db.query(sql_query, [object.usedKarupatti, 4, 1]);
      sql_query = `update production_stack set quantity=quantity-? where ppid=? AND cpid=?`;
      await db.query(sql_query, [object.produced_oil, 1, object.cpid]);
      await db.query(sql_query, [object.produced_cake, 2, object.cpid]);
      break;

    case LogType.TRANSACTION:
      sql_query = `update production_stack set quantity = quantity+ ? where ppid = ? and cpid = ?`
      await db.query(sql_query,[object.quantity,object.opid,object.cpid])
      sql_query = `update total_stack set quantity = quantity- ? where opid = ? and  sid = ? and cpid = ?`
      await db.query(sql_query,[object.quantity,object.opid,object.sid,object.cpid])
      break;

  }
  sql_query = `delete from ${tableName} where id=${id}`;

  await db.query(sql_query, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
};

exports.undo = undo;
exports.production_grinding = production_grinding;
exports.production_addition = production_addition;
exports.getLog = getLog;
