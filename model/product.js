const db = require('../db');


const getProducts = async (connection = db) =>{
   
    const [result] = await connection.query('select * from products');
    return result;

}


const addProduct = async ( productId ,productName, price, type, connection = db) => {
    
    return await connection.query('INSERT INTO products (id, name, price, type) VALUES (?, ?, ?, ?)',[productId,productName,price,type]);
    
   

}

const softRemoveProduct = async( productId , connection = db) => {
    return await connection.query('update products set is_active = ? where id = ?',[false,productId]);
}
const activateProduct = async( productId , connection = db ) => {

    return await connection.query('update products set is_active = ? where id = ?',[true,productId]);

}

const getActiveProducts = async(value,connection = db) =>{
    let sql_query = 'select * from products where is_active = 1 ';
    const p = [];
    if(value && value !== "")
            {
                sql_query += "AND name LIKE ?"
                p.push(`%${value}%`)
            }
    const[result] = await connection.query(sql_query,p);
    return result;
}

const getInActiveProducts = async (value, connection = db) => {
    let sql_query = 'select * from products where is_active = 0 ';
    const p = [];
    if(value && value !== "")
            {
                sql_query += "AND name LIKE ?"
                p.push(`%${value}%`)
            }
    const[result] = await connection.query(sql_query,p);
    return result;
}

const updatePrice = async ( productId , price, connection = db) => {
    return await connection.query('update products set price = ? where id = ?',[price, productId]);
}

const getProductLike = async ( productName , productType ,connection = db  ) => {

    const sql = `select * from products where name LIKE ? AND type=?`;
    const [result] = await connection.query(sql, [`%${productName}`, productType]);
    return result[0];

}

const getProductById = async (productId, connection = db) => {
    const [result] = await connection.query('select * from products where id = ?', [productId]);
    return result[0]; 
}

const getProductsByType = async (productType, connection = db) => {
    const [result] = await connection.query('select * from products where type = ?', [productType]);
    return result;
}

const getLastProductId = async(connection = db) => {
    const [result] = await connection.query(' select MAX(id) as max from products');
    return result[0].max;
}

module.exports = {
    getProducts,
    addProduct,
    softRemoveProduct,
    activateProduct,
    getActiveProducts,
    getInActiveProducts,
    updatePrice,
    getProductLike,
    getProductById,
    getProductsByType,
    getLastProductId
};



