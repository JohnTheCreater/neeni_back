const db = require('../db');


const getSales = async(connection = db)=>{

    const [result] = await connection.query('select * from sales');
    return result; 
}

const getSalesByBillNumber = async (billNumber , connection = db) => {
    const [result] = await connection.query('select * from sales where bill_no = ?',[billNumber]);
    return result;
}

const addSales = async (saleData,connection = db) => {
    return await connection.query('insert into sales(pid, quantity, paid_status, bill_no, price, sub_total) VALUES ?',[saleData]);

}

const deleteAllSalesByBillNumber = async(billNumber , connection = db) => {
    return await connection.query('delete from sales where bill_no = ?',[billNumber]); 
}

module.exports = {
    getSales,
    getSalesByBillNumber,
    addSales,
    deleteAllSalesByBillNumber
}

