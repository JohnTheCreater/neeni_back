const dayjs = require("dayjs");
const db = require(".././db");

const addBottles = async (req, res) => {
  
  const { sid, cpid, cvid, value } = req.body;
  try{
  const core_volume = await db.query("select * from core_volume");
  const quan = core_volume.map((item) => item.value);
  const outputId = cvid < 5 ? 1 : 2;
  const val = quan[cvid - 1];
  console.log(val*quan)
  const total_stack = await db.query(
    "select * from total_stack where cpid=?  AND sid=? AND opid=?",
    [cpid, sid, outputId]
  );
  if (
    !total_stack ||
    total_stack.length <= 0 ||
    total_stack[0].quantity < value * val
  ) {
    res.status(400).send("No Stack Available at Shop!");
    return;
  }
  await db.query("UPDATE total_stack set quantity=quantity-? where cpid=? AND sid=? AND opid=?",[value * val, cpid, sid, outputId])

  let sql_query =
    "UPDATE avail_stack set quantity=quantity+? where sid=? AND cpid=? AND cvid=?";

  await db.query(sql_query, [value, sid, cpid, cvid])
  res.status(200).send("updated suc!");
}
catch(err){

    res.status(err.code).send("Error!")
}

};

const addStack = async (req, res) => {

  const { cpid, opid, sid, value,date } = req.body;
  const productionStack = await db.query("select quantity from production_stack where cpid=? AND ppid=?",[cpid,opid]);
  const productionStackQuantity = await productionStack[0].quantity;
  if(Number(productionStackQuantity) < Number(value))
  {
    res.status(400).send("No Stack Available at Production Stack!")
    return;
  }
  let sql_query = `Update total_stack set quantity=quantity+? where cpid=? AND opid=? AND sid=?`;

  await db.query(sql_query, [value, cpid, opid, sid], (err, result) => {
    if (err) throw err;
    console.log(value)


    db.query(
      "update production_stack set quantity=quantity-? where cpid=? AND ppid=?",
      [value, cpid, opid],
      (err, re1) => {

        if (err) throw err;
        
        let query = "insert into product_transaction_log(cpid,opid,sid,quantity,date) values (?,?,?,?,?)"
        const formatedDate = dayjs(date).format("YYYY-MM-DD hh:mm:ss")
        db.query(query,[cpid,opid,sid,value,formatedDate],(err,ress)=>{
          if(err) throw err;
        })
      }
    );
    res.status(200).send("updated");
  });
};
exports.addStack = addStack;
exports.addBottles = addBottles;
