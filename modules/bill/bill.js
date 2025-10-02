const db = require('../../db');
const { getFormatedDate } = require('../util/util');

const getBills = async(connection = db) => {
    const [result] = await connection.query('select * from bills');
    return result;
}

const getActiveBills = async(connection = db) => {
     const [result] = await connection.query('select * from bills where is_active = 1');
    return result;

}

const getActiveBillsPage = async(limit,offset,value,connection = db) =>{

    const searchQuery = value.trim();
        console.log(searchQuery,limit,offset)

        let sql_query = `select b.id,b.customer_id,b.date,b.shopid,b.paid_amount,b.bill_amount,c.name as customerName , s.name as shopName from bills b 
        LEFT join customers c ON c.id = b.customer_id 
        LEFT join shops s ON s.id = b.shopid
    where b.is_active = 1 `
    const params = [];
    if(searchQuery !== "")
        {
          
            sql_query += ' AND c.name LIKE ? '
            params.push(`%${searchQuery}%`)
        }
        sql_query += ' limit ? offset ?'
    params.push(limit);
    params.push(offset)
    const [result] = await connection.query(sql_query,params);

     sql_query = `select COUNT(*) as r from bills b 
    LEFT join customers c ON c.id = b.customer_id 
    where b.is_active = 1 `
    const p = [];
    if(searchQuery !== "")
        {
          
            sql_query += ' AND c.name LIKE ? '
            p.push(`%${searchQuery}%`)
        }
     
    const [res] = await connection.query(sql_query,p)



    return { pages : Math.ceil(res[0].r/limit) , result};

}

const getBillById = async( id , connection = db) => {

    let sql_query = `
    select b.id,b.customer_id,b.date,b.shopid,b.paid_amount,b.bill_amount,
    b.created_at, b.updated_at,b.deleted_at,c.name ,c.gender,c.email,
    c.mobileno,c.address,c.city,c.pincode,c.gstnumber,c.is_active,
    s.name as shopName
     from bills b 
     Left Join customers c ON c.id = b.customer_id 
     Left Join shops s ON s.id = b.shopid
     where b.id = ? AND b.is_active = 1
    `
    console.log(id)
    const [result] = await connection.query(sql_query,[id]);

    return result[0];
}

const getBillsInRange = async(startDate,endDate,shopId,limit,offset,connection = db) => {

    const [result] = await connection.query(`
        select b.id,b.customer_id,b.date,b.shopid,b.paid_amount,b.bill_amount,c.name as customerName ,s.name as shopName from bills b 
        LEFT join customers c ON c.id = b.customer_id 
        LEFT join shops s ON s.id = b.shopid
        where b.is_active = 1 AND date between ? AND ? AND shopid = ? LIMIT ? OFFSET ?`,[startDate,endDate,shopId,limit,offset]);
    const res = await getPaymentInfoForMonth(startDate,endDate,shopId);
    const [response] = await connection.query(`select COUNT(*) as r from bills b 
        LEFT join customers c ON c.id = b.customer_id 
        LEFT join shops s ON s.id = b.shopid
        where b.is_active = 1 AND date between ? AND ? AND shopid = ?`,[startDate,endDate,shopId])
    return {...res,pages : Math.ceil(response[0].r / limit),result};
}
const getBillsByCustomerId = async(customerId, connection = db) => {
        let sql_query = `select * from bills where customer_id = ? AND is_active = 1`
        const [result] = await connection.query(sql_query,[customerId]);
        return result;

}
const getBillsByCustomerIdPage = async(customerId ,limit,offset, connection = db) => {

    let sql_query = ` 
    select b.id,b.customer_id,b.date,b.shopid,b.paid_amount,b.bill_amount,
    b.created_at, b.updated_at,b.deleted_at,c.name as customerName ,c.gender,c.email,
    c.mobileno,c.address,c.city,c.pincode,c.gstnumber,c.is_active,
    s.name as shopName
     from bills b 
     Left Join customers c ON c.id = b.customer_id 
     Left Join shops s ON s.id = b.shopid
      where  b.is_active = 1 AND b.customer_id = ? 
      ORDER BY b.date DESC
       LIMIT ? OFFSET ? 
     `
    const [result] = await connection.query(sql_query,[customerId,limit,offset]);
    sql_query = ` 
    select count(*) as r
     from bills b 
     Left Join customers c ON c.id = b.customer_id 
     Left Join shops s ON s.id = b.shopid
      where  b.is_active = 1 AND b.customer_id = ? 
     `
     const [res] = await connection.query(sql_query,[customerId])

    return { pageCount : Math.ceil(res[0].r / limit) , result };
}

const addBill = async(billData, connection = db) => {

    const {billNumber,customerId, date, shopId, paidAmount, billAmount} = billData;
    
    const query = `INSERT INTO bills(id,customer_id, date, shopid, paid_amount, bill_amount) VALUES (? ,?, ?, ?, ?, ?)`;
    const [result] = await connection.query(query, [billNumber,customerId, date, shopId, paidAmount, billAmount]);
    
    return {
        billId: result.insertId,
        affectedRows: result.affectedRows
    };
}

const updateBill = async( billData, connection = db) => {

    const {customerId, shopId, date, paidAmount, billAmount , billNumber} = billData;
    
    const query = `UPDATE bills SET customer_id = ? ,shopid = ? , date = ?, paid_amount = ?, bill_amount = ? WHERE id = ?`;
    const [result] = await connection.query(query, [customerId ,shopId ,date, paidAmount, billAmount,billNumber]);
    
    return result;
}

const deleteBill = async(billId, connection = db) => {
    
    const [result] = await connection.query('Update bills set is_active = 0,deleted_at = ? where id = ?', [getFormatedDate(new Date()),billId]);
    return result;
}

const getNextBillNumber = async()=>
{
   const [rows] = await db.query("SELECT MAX(id) + 1 AS next_id FROM bills");
    const nextBillId = rows[0].next_id || 1;
    return nextBillId;
}

const getPaymentInfoForMonth = async(startDate,endDate,shopId,connection = db)=>{

  
    
    const query=`SELECT SUM(paid_amount) as paid_amount FROM bills WHERE date BETWEEN ? AND ? AND is_active = 1 AND shopid = ?`
    const [paidAmountResult] = await connection.query(query,[startDate,endDate,shopId]);
    const paidAmount = paidAmountResult[0].paid_amount || 0;
    const paidQuery = `select sum(sales.sub_total) as total from sales inner join bills where sales.bill_no=bills.id AND date BETWEEN ? AND ? AND paid_status=? AND is_active = 1 AND shopid = ?`
    const [totalPaidResult]= await connection.query(paidQuery,[startDate,endDate,"paid",shopId]);
    const totalPaid = totalPaidResult[0].total || 0;
    const totalRecived = parseFloat(paidAmount)+parseFloat(totalPaid);
    const totalBillQuery  = `select sum(sales.sub_total) as total from sales inner join bills where sales.bill_no=bills.id AND date BETWEEN ? AND ? AND is_active = 1 AND shopid = ?`
    const [totalBillAmountResult ]= await connection.query(totalBillQuery,[startDate,endDate,shopId]);
    const totalRemainingPayment = totalBillAmountResult[0].total- totalRecived;
    const responseData = {paid:parseFloat(totalRecived).toFixed(2),unpaid:parseFloat(totalRemainingPayment).toFixed(2)}

    return responseData;
    

}



module.exports = {
    getBills,
    getActiveBills,
    getActiveBillsPage,
    getBillsByCustomerId,
    getBillsByCustomerIdPage,
    getBillById,
    getBillsInRange,
    addBill,
    updateBill,
    deleteBill,
    getNextBillNumber,
    getPaymentInfoForMonth
};