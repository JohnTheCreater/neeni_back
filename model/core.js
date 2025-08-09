const db = require('../db');


const addTypeOneInfo = async(productId,cpid,cvid,connection = db)=>
{
    return await connection.query('insert into type1info(pid,cpid,cvid) values (?,?,?)',[productId,cpid,cvid]);
}

const getCoreProducts = async ( connection = db) => {

    const [result] = await connection.query('select * from core_product');
    return result;
}

const getCoreVolumes = async ( connection = db) => {
    const [result] = await connection.query('select * from core_volume');
    return result;
}

const getShops = async (connection = db) => {
    const [result] = await connection.query('select * from shops');
    return result;
}

const getProductTypeOneInfo = async ( productId ,connection = db) => {
    const [result] = await connection.query('select cpid,cvid from type1info where pid = ? ',[productId]);
    return result[0];
}

const getOutputs = async (connection = db)=>{
     const [result] = await connection.query('select * from output');
    return result;

}

module.exports = {
    getCoreProducts,
    getCoreVolumes,
    getProductTypeOneInfo,
    getShops,
    getOutputs,
    addTypeOneInfo
}


