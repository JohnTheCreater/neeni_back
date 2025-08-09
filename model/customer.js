const db = require('../db');

const getCustomers = async(connection = db) => {

   
    const [rows] = await connection.query('select * from customers ');
    return rows;

}

const getAciveCustomers = async(connection = db) => {

   
    const [rows] = await connection.query('select * from customers where is_active = 1');
    return rows;

}

const getInActiveCustomers = async(connection = db) => {
     
    const [rows] = await connection.query('select * from customers where is_active = 0');
    return rows;

}

const getCustomersWithPaymentInfo = async(connection = db) =>
{
    let sql_query = `select id,name,email,mobileno,address,pincode,
    IFNULL((select sum(remaining_amount)  from 
    (select  bills.id,sum(bill_amount)-sum(paid_amount)-IFNULL((select sum(sub_total) from sales where bill_no = bills.id and paid_status = "paid"),0) 
    as remaining_amount from bills where customer_id = customers.id group by bills.id) as rem),0) as unpaid ,
    IFNULL((select sum(bill_amount) from bills where customer_id = customers.id),0) as bill_amount
    from customers  WHERE  is_active = 1`;
    const [result] = await connection.query(sql_query);
    return result;
}

const getCustomerById = async(id , connection = db) =>{

    const [result] = await connection.query('select * from customers where id = ? And is_active = 1',[id]);
    return result[0];

}

const isEmailPresent = async (email,connection = db) => {

    const [result] = await connection.query('select * from customers where email = ?',[email]);
    if(result.length == 0) return false;
    return true;

}

const addCustomers = async(values,connection = db) =>{

    return await connection.query('INSERT INTO customers (name, gender, email, mobileno, address, city, state, pincode, gstnumber) VALUES ?',[values]);
    
}

const updateCustomer = async(values,connection = db) =>{

    return await connection.query('UPDATE customers SET name = ?,gender = ?,mobileno = ?,address = ?,city = ?,state = ?,pincode = ?,gstnumber = ?,is_active = ? WHERE id = ?',values);
}

const softRemoveCustomer = async(customerId , connection = db) =>{

    return await connection.query(`
        UPDATE customers 
        SET updated_at = NOW(), is_active = 0 
        WHERE id = ?
    `, [customerId]);

}

const hardRemoveCustomer = async(customerId , connection = db)=>{
    return await connection.query(`delete from customers where id = ?`,[customerId]);

}

const activateCustomer = async(inActiveCustomerId, connection = db) =>
{
     return await connection.query(`
        UPDATE customers 
        SET updated_at = NOW(), is_active = 1 
        WHERE id = ?
    `, [inActiveCustomerId]);

}

module.exports = {
    getCustomers,
    getCustomerById,
    getCustomersWithPaymentInfo,
    addCustomers,
    softRemoveCustomer,
    updateCustomer,
    isEmailPresent,
    getAciveCustomers,
    getInActiveCustomers,
    activateCustomer,
    hardRemoveCustomer
}



