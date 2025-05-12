const db = require("../db");
const bcrypt = require("bcrypt");

const setUsernamePassword = async (req, res) => {
  const { username, password } = req.body;
  bcrypt.hash(password, 10, async (err, hash) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error hashing password");
      return;
    }

    try {
      await updateOrInsertAdmin(username, hash);
      res.status(200).send('Admin updated or inserted successfully');
    } catch (err) {
      res.status(500).send('An error occurred');
    }
  });
};

const updateOrInsertAdmin = async (username, hash) => {
  try {
    let updateQuery = `UPDATE admin SET username = ?, password = ?`;
    let updateResult = await db.query(updateQuery, [username, hash]);

    if (updateResult.affectedRows === 0) {
      let insertQuery = `INSERT INTO admin (username, password) VALUES (?, ?)`;
      await db.query(insertQuery, [username, hash]);
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};


const doLogin=async(req,res)=>{
    const{username,password}=req.body
    await db.query("select * from admin",(err,result)=>{
        if(err)
        {
            res.status(500).send("crediential error")
            return
        }
        if(!result)
        {
          res.status(400).send("No username and password is setted!")
        }
        bcrypt.compare(password,result[0].password,(err,result1)=>{
            if(err) console.log(err);
            else if(result1)
            {
                console.log(result1,"matched")
                res.status(200).send("ok")
            }
            else
            {
                res.status(600).send("not ok")
                console.log("not matched")


            }
        })

    })
}

exports.doLogin=doLogin
exports.setUsernamePassword = setUsernamePassword;
