const db=require('../db')
const dayjs=require('dayjs')

const production_addition=async(req,res)=>{
    const { rawData } = req.body;

  let sql_query = `insert into prod_add (ppid,cpid,quantity,date) values(?,?,?,?)`;
  await db.query(sql_query,[rawData.product,rawData.type,rawData.value,dayjs(rawData.date).format("YYYY-MM-DD hh:mm:ss")],(err, result) => {
    if (err) throw err;
    res.status(200).send(result);
  });
}

const production_grinding=async(req,res)=>{
  const{grindData}=req.body;
  const karupatti=grindData?.karupatti||0;
  const date=dayjs(grindData.data).format('YYYY-MM-DD hh:mm:ss')
  let sql_query=`insert into prod_grind (cpid,used,karupatti,grind,produced_oil,produced_cake,date) values(?,?,?,?,?,?,?)`

  await db.query(sql_query,[grindData.oilType,grindData.used,karupatti,grindData.grind,grindData.producedOil,grindData.producedCake,date],(err,result)=>{
    if(err) throw err;
    if('karupatti' in grindData)
    {
      db.query("update production_stack set quantity=quantity-? where cpid=1 AND ppid=4",[grindData.karupatti],(err,result1)=>{
        if(err) throw err;
    })
    }
    res.status(200).send('grind inserted!')
  })


}


const getLog = async (req, res) => {
  const { startDate, endDate } = req.params;
  console.log(startDate, endDate);
  let sql_query = `select * from prod_add where date between '${dayjs(
    endDate
  ).format("YYYY-MM-DD hh:mm:ss")}' AND '${dayjs(startDate).format(
    "YYYY-MM-DD hh:mm:ss"
  )}'`;
  await db.query(sql_query, async (err, result) => {
    if (err) throw err;
    let query = `select * from prod_grind where date between '${dayjs(
      endDate
    ).format("YYYY-MM-DD hh:mm:ss")}' AND '${dayjs(startDate).format(
      "YYYY-MM-DD hh:mm:ss"
    )}'`;
    await db.query(query, (err, result1) => {
      if (err) throw err;
      console.log(result,result1)
      res.status(200).send(result.concat(result1));
    });
  });
};


const undo=async(req,res)=>{

  const{id,type}=req.body
  let tableName=type===1?"prod_add":"prod_grind"
  let sql_query=`delete from ${tableName} where id=${id}`
  await db.query(sql_query,(err,result)=>{
      if(err) throw err
      res.send(result)
  })

}


exports.undo=undo
exports.production_grinding=production_grinding
exports.production_addition=production_addition
exports.getLog = getLog;
