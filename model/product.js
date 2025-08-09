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

const getActiveProducts = async(connection = db) =>{
    const[result] = await connection.query('select * from products where is_active = true');
    return result;
}

const getInActiveProducts = async ( connection = db) => {
    const [result] = await connection.query('select * from products where is_active = false');
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



