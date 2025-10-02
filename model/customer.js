const db = require('../db');

const getCustomers = async (value,connection = db) => {

let sql_query = `select * from customers `
    const p = [];
    if(value && value != "")
    {
        sql_query += 'where name LIKE ?'
        p.push(`%${value}%`);
    }

    const [rows] = await connection.query(sql_query,p);
    return rows;

}

const getActiveCustomers = async (value,connection = db) => {

    let sql_query = `select * from customers where is_active = 1 `
    const p = [];
    if(value && value != "")
    {
        sql_query += 'AND name LIKE ?'
        p.push(`%${value}%`);
    }

    const [rows] = await connection.query(sql_query,p);
    return rows;

}

const getInActiveCustomers = async (connection = db) => {

    const [rows] = await connection.query('select * from customers where is_active = 0');
    return rows;

}

const getCustomersWithPaymentInfo = async (limit, offset, value, connection = db) => {
    let sql_query = `
    SELECT id,name,email,mobileno,address,pincode,
        IFNULL((
            SELECT SUM(remaining_amount)  
            FROM (
                SELECT bills.id,
                       SUM(bill_amount) - SUM(paid_amount) 
                       - IFNULL((
                            SELECT SUM(sub_total) 
                            FROM sales 
                            WHERE bill_no = bills.id 
                              AND paid_status = "paid"
                         ),0) AS remaining_amount
                FROM bills 
                WHERE customer_id = customers.id AND bills.is_active = 1
                GROUP BY bills.id
            ) AS rem
        ),0) AS unpaid,
        IFNULL((
            SELECT SUM(bill_amount) 
            FROM bills 
            WHERE customer_id = customers.id AND bills.is_active = 1
        ),0) AS bill_amount
    FROM customers
    WHERE is_active = 1
`;

    let params = [];

    
    if (value && value.trim() !== "") {
        sql_query += ` AND customers.name LIKE ?`;
        params.push(`%${value}%`);
    }

  
    sql_query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

   
    const [result] = await connection.query(sql_query, params);

  
    let countQuery = `SELECT COUNT(*) as total FROM customers WHERE is_active = 1`;
    let countParams = [];

    if (value && value.trim() !== "") {
        countQuery += ` AND customers.name LIKE ?`;
        countParams.push(`%${value}%`);
    }

    const [res] = await connection.query(countQuery, countParams);

    const response = {
        customerList: result,
        pageCount: Math.ceil(res[0].total / limit)
    };
    return response;

}

const getCustomerById = async (id, connection = db) => {

    const [result] = await connection.query('select * from customers where id = ? And is_active = 1', [id]);
    return result[0];

}

const isEmailPresent = async (email, connection = db) => {

    const [result] = await connection.query('select id from customers where email = ?', [email]);
    if (result.length == 0) return false;
    return true;
}

const isEmailPresentExcept = async (email,customerId , connection = db) => {

    const [result] = await connection.query('select id from customers where email = ? AND id != ?', [email,customerId]);
    if (result.length == 0) return false;
    return true;
}


const addCustomer = async (values, connection = db) => {

    return await connection.query('INSERT INTO customers (name, gender, email, mobileno, address, city, state, pincode, gstnumber) VALUES (?)', [values]);

}

const updateCustomer = async (values, connection = db) => {

    return await connection.query('UPDATE customers SET name = ?,gender = ?,email = ?,mobileno = ?,address = ?,city = ?,state = ?,pincode = ?,gstnumber = ?,is_active = ? WHERE id = ?', values);
}

const softRemoveCustomer = async (customerId, connection = db) => {

    return await connection.query(`
        UPDATE customers 
        SET updated_at = NOW(), is_active = 0 
        WHERE id = ?
    `, [customerId]);

}

const hardRemoveCustomer = async (customerId, connection = db) => {
    return await connection.query(`delete from customers where id = ?`, [customerId]);

}

const activateCustomer = async (inActiveCustomerId, connection = db) => {
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
    addCustomer,
    softRemoveCustomer,
    updateCustomer,
    isEmailPresent,
    isEmailPresentExcept,
    getActiveCustomers,
    getInActiveCustomers,
    activateCustomer,
    hardRemoveCustomer
}



