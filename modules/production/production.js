const db = require('../../db');

const getProductionProducts = async(connection = db) => {
    const [result] = await connection.query('select * from production_products');
    return result;
}

const getProductionLogs = async( month ,year ,connection = db) => {

    const sql_query = "Select * from prod_add where MONTH(date) = ? AND YEAR(date) = ? ";
    const [result1] = await connection.query(sql_query,[month,year]);
    const query = "select * from prod_grind where MONTH(date) = ? AND YEAR(date) = ? ";
    const [result2] = await connection.query(query,[month,year]);
    const sq =  "select * from production_transaction_log where MONTH(date) = ? AND YEAR(date) = ?"

    const [result3] = await connection.query(sq,[month,year]);

    const r1 = Array.isArray(result1) ? result1 : [result1];
    const r2 = Array.isArray(result2) ? result2 : [result2];
    const r3 = Array.isArray(result3) ? result3 : [result3];
    const res =  [...r1,...r2,...r3];

    return res;
}

const addAdditionLog = async ( coreProductId,productionProductId, quantity , date ,connection = db) => {
    
    return await connection.query('insert into prod_add (ppid,cpid,quantity,date) values(?,?,?,?)',[productionProductId,coreProductId,quantity,date]);

}

const addGrindLog = async (coreProductId ,usedRaw ,usedKarupatti ,grind ,producedOil ,producedCake ,date ,connection = db) => {
    return await connection.query('insert into prod_grind (cpid,used_raw,used_karupatti,grind,produced_oil,produced_cake,date) values(?,?,?,?,?,?,?)',
        [
            coreProductId,
            usedRaw,
            usedKarupatti,
            grind,
            producedOil,
            producedCake,
            date
        ]
    );
}

const addTransactionLog = async (coreProductId,outputId,shopId,quantity,date,connection = db) =>{
    return await connection.query('insert into production_transaction_log(cpid,opid,sid,quantity,date) values (?,?,?,?,?)',
        [
            coreProductId,
            outputId,
            shopId,
            quantity,
            date

        ]
    );
}

const removeLog = async(id , type = 'addition',connection)=>{
    let tableName;
    switch(type)
    {
        case 'addition':
            tableName = 'prod_add';
            break;
        case 'grind':
            tableName = 'prod_grind';
            break;
        case 'transaction':
            tableName = 'production_transaction_log';
            break;
        default:
            tableName = 'prod_add';
    }

    return await connection.query('delete from ?? where id = ?',[tableName,id]);

}

const removeAdditionLog = (id,connection = db) => {
    
    return  removeLog(id,'addition',connection);

}
const removeGrindLog = (id,connection = db) => {
    
    return  removeLog(id,'grind',connection);

}

const removeTransactionLog = (id,connection = db) => {
    
    return  removeLog(id,'transaction',connection);

}


const getAdditionLogById = async(id,connection = db)=>{
    const [result] = await connection.query('select * from prod_add where id = ?',[id]);
    return result[0];
}

const getGrindLogById = async(id,connection = db) =>{
    const [result] = await connection.query('select * from prod_grind where id = ?',[id]);
    return result[0];
}

const getTransactionLogById = async(id,connection = db) => {
    const [result] = await connection.query('select * from production_transaction_log where id = ?',[id]);
    return result[0];
    
}

module.exports = {
    getProductionLogs,
    getProductionProducts,
    getAdditionLogById,
    getGrindLogById,
    getTransactionLogById,
    addAdditionLog,
    addGrindLog,
    addTransactionLog,
    removeAdditionLog,
    removeGrindLog,
    removeTransactionLog
    
}


