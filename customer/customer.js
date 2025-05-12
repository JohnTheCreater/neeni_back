const db = require("../db");

const add_customer = (req, res) => {
  const users = req.body;

  const values = users.map((user) => [
    user.fullname,
    user.gender,
    user.email,
    user.mobileno,
    user.address,
    user.city,
    user.state,
    user.zip,
    user.gst || null,
  ]);

  let sql_query = `INSERT INTO user (name, gender, email, mobileno, address, city, state, pincode, gstnumber) VALUES ?`;

  db.query(sql_query, [values], (err, result) => {
    if (err) {
      console.error(err);                                                        
      return res.status(500).send("Error adding user.");
    }
    res.send("User added successfully.");
  });
};

const checkEmail = async (req, res) => {
  const { email, id } = req.body;
  let sql_query = "";
  if (!id) sql_query = `select name from user where email=?`;
  else
    sql_query = `select name from user where email=? AND id != ?`;

  await db.query(sql_query,[email,id||null], (err, result) => {
    if (err) throw err;
    console.log(result.length);
    if (email === process.env.ADMIN_GMAIL || result.length == 0)
      res.status(200).send({ message: "no user found!" });
    else res.status(409).send({ message: "already have user!" });
  });
};

const updateCustomer = async (req, res) => {
  const { customer } = req.body;
  let sql_query = `UPDATE user SET name=?,gender=?,mobileno=?,address=?,city=?,state=?,pincode=?,gstnumber=? WHERE id=?`;
  await db.query(
    sql_query,
    [
      customer.name,
      customer.gender,
      customer.mobileno,
      customer.address,
      customer.city,
      customer.state,
      customer.pincode,
      customer.gstnumber|| null,
      customer.id,
    ],
    (err, result) => {
      if (err) res.status(500).send();
      console.log("user updated", customer);
      
      res.status(200).send();
    }
  );
};

const removeCustomer = async (req, res) => {
  const { id } = req.body;
  let sql_query = `delete from user where id=?`;
  await db.query(sql_query, [id], (err, result) => {
    if (err) res.status(500).send();
    console.log("removed");
    res.status(200).send();
  });
};

const getUserList = async (req, res) => {
  let sql_query = `select id,name from user;`;

  await db.query(sql_query, (err, result) => {
    if (err) throw err;
    res.status(200).send(result);
  });
};

const getRemainingPayment = async(req,res)=>{
  const {userId} = req.body;

  try{
  const query = `select sum(paidAmount) as paidAmount from bills where userid = ?`;
  const paidAmountResult = await db.query(query,[userId]);
  const paidAmount = paidAmountResult[0].paidAmount;
  const sql_query = `select sum(sub_total) as unpaid from sales
inner join bills where paidStatus = "unpaid" AND bills.id = bill_no AND userid = ?`
  const unpaidResult = await db.query(sql_query,[userId]);
  const unpaid = unpaidResult[0].unpaid;
  const remainingAmount = unpaid - paidAmount;
    const sql_query2 = `select sum(sub_total) as total from sales
inner join bills where  bills.id = bill_no AND userid = ?`
const totalResult = await db.query(sql_query2,[userId]);
const totalAmount = totalResult[0].total; 
  res.status(200).send({remainingAmount,totalAmount});
  }
  catch(err)
  {
    console.log(err);
    res.status(500).send(err.message);
  }
}

const getCustomers = async(req,res)=>{

  try{
    let sql_query = `select id,name,email,mobileno,address,pincode,
    IFNULL((select sum(remainingAmount)  from 
    (select  bills.id,sum(bill_amount)-sum(paidAmount)-IFNULL((select sum(sub_total) from sales where bill_no = bills.id and paidStatus = "paid"),0) 
    as remainingAmount from bills where userid = user.id group by bills.id) as rem),0) as unpaid ,
    IFNULL((select sum(bill_amount) from bills where userid = user.id),0) as bill_amount
    from user `;
    const result = await db.query(sql_query);
    res.status(200).send(result);


  }
  catch(err)
  {
    console.log(err);
    res.status(500).send("Internal Error!");

  }

}



const getBills = async(req,res)=>{

  const {userid} = req.body;

  try{
    let sql_query = `select * from bills where userid = ?`;
    const result = await db.query(sql_query,[userid]);
    res.status(200).send(result);
  }
  catch(err)
  {
    console.log(err);
    res.status(500).send("Internal error!");
  }



}

exports.getBills = getBills
exports.getRemainingPayment=getRemainingPayment;
exports.getUserList = getUserList;
exports.add_customer = add_customer;
exports.checkEmail = checkEmail;
exports.updateCustomer = updateCustomer;
exports.removeCustomer = removeCustomer;
exports.getCustomers = getCustomers;