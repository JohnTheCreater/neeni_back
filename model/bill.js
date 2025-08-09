const db = require('../db')

const getBills = async(connection = db) => {
    const [result] = await connection.query('select * from bills');
    return result;
}

const getBillById = async( id , connection = db) => {
    const [result] = await connection.query('select * from bills where id = ?',[id]);

    return result[0];
}

const getBillsInRange = async(startDate,endDate,connection = db) => {
    const [result] = await connection.query('select * from bills where date between ? AND ?',[startDate,endDate]);
    return result;
}

const getBillsByCustomerId = async(customerId , connection = db) => {
    const [result] = await connection.query('select * from bills where customer_id = ?',[customerId]);
    return result;
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
    const [result] = await connection.query('DELETE FROM bills WHERE id = ?', [billId]);
    return result;
}

const getNextBillNumber = async()=>
{
   const [rows] = await db.query("SELECT MAX(id) + 1 AS next_id FROM bills");
    const nextBillId = rows[0].next_id || 1;
    return nextBillId;
}

const getPaymentInfoForMonth = async(date,connection = db)=>{

  
    const newdate = new Date(date);
    const startDate = new Date(newdate.getFullYear(),newdate.getMonth(),1);
    const endDate = new Date(newdate.getFullYear(),newdate.getMonth()+1,0,23, 59, 59, 999);
     

    
    const query=`SELECT SUM(paid_amount) as paid_amount FROM bills WHERE date BETWEEN ? AND ?`
    const [paidAmountResult] = await connection.query(query,[startDate,endDate]);
    const paidAmount = paidAmountResult[0].paid_amount || 0;
    const paidQuery = `select sum(sales.sub_total) as total from sales inner join bills where sales.bill_no=bills.id AND date BETWEEN ? AND ? AND paid_status=?`
    const [totalPaidResult]= await connection.query(paidQuery,[startDate,endDate,"paid"]);
    const totalPaid = totalPaidResult[0].total || 0;
    const totalRecived = parseFloat(paidAmount)+parseFloat(totalPaid);
    const totalBillQuery  = `select sum(sales.sub_total) as total from sales inner join bills where sales.bill_no=bills.id AND date BETWEEN ? AND ?`
    const [totalBillAmountResult ]= await connection.query(totalBillQuery,[startDate,endDate]);
    const totalRemainingPayment = totalBillAmountResult[0].total- totalRecived;
    const responseData = {paid:parseFloat(totalRecived).toFixed(2),unpaid:parseFloat(totalRemainingPayment).toFixed(2)}

    return responseData;
    

}



module.exports = {
    getBills,
    getBillById,
    getBillsInRange,
    getBillsByCustomerId,
    addBill,
    updateBill,
    deleteBill,
    getNextBillNumber,
    getPaymentInfoForMonth
};