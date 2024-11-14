const mysql=require('mysql2')
const util=require('util')

const pool=mysql.createPool({host:'localhost',user:'root',password:'john',database:'neeni',port:3306})

pool.query=util.promisify(pool.query)

module.exports=pool

