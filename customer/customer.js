const db = require("../db");

const add_customer = (req, res) => {
  const users = req.body;

  let values = users
    .map(
      (user) =>
        `('${user.fullname}','${user.gender}','${user.email}','${user.mobileno}','${user.address}','${user.city}','${user.state}','${user.zip}','${user.gst?user.gst:null}')`
    )
    .join(",");
  let sql_query = `INSERT INTO user (name,gender,email,mobileno,address,city,state,pincode,gstnumber) VALUES ${values}`;

  db.query(sql_query, (err, result) => {
    if (err) throw err;
    res.send("user added..");
  });
};

const get_customer = (req, res) => {
  const { list } = req.body;
  let values = "";
  if (list?.length>0)
    values = `where id in (${list.join(',')})`
  let sql_query = `select * from user ${values}`;
  db.query(sql_query, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
};

const checkEmail=async (req,res)=>{
  const{email,id}=req.body;
  let sql_query='';
  if(!id)
    sql_query=`select name from user where email='${email}'`
  else
    sql_query=`select name from user where email='${email}' AND id != ${id}`

  await db.query(sql_query,(err,result)=>{
    if(err) throw err;
    console.log(result.length)
    if(email==='neenikafoodpower@gmail.com' || result.length==0)
      res.status(200).send({message:"no user found!"})
    else
      res.status(409).send({message:"already have user!"});
  })
}


const updateCustomer=async (req,res)=>{
  const {id,user}=req.body
  let sql_query=`UPDATE user SET name='${user.fullname}',gender='${user.gender}',email='${user.email}',mobileno='${user.mobileno}',address='${user.address}',city='${user.city}',state='${user.state}',pincode='${user.zip}',gstnumber='${user.gst?user.gst:null}' WHERE id=${id}`
  await db.query(sql_query,(err,result)=>{
    if(err) res.status(500).send();
    res.status(200).send();
  })

}


const removeCustomer=async(req,res)=>{
  const {id}=req.body
  let sql_query=`delete from user where id=${id}`
  await db.query(sql_query,(err,result)=>{
    if(err) res.status(500).send()
    console.log("removed")
    res.status(200).send()
  })
}


const getUserList=async(req,res)=>{
  let sql_query= `select id,name from user;`

  await db.query(sql_query,(err,result)=>{
    if(err) throw err;
    res.status(200).send(result);
  })
}

exports.getUserList=getUserList;
exports.add_customer = add_customer;
exports.get_customer = get_customer;
exports.checkEmail=checkEmail;
exports.updateCustomer=updateCustomer;
exports.removeCustomer=removeCustomer;
