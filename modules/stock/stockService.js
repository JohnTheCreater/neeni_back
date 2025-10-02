const stockModel = require('./stock');
const coreModel = require('../core/core')
const db = require ('../../db');
const AppError = require('../error/appError');
const { getInternalErrorResult, getAppErrorResult } = require('../util/util');

const updatePackedStock = async (stockInfo)=>{

    let {cpid,cvid,sid,quantity} = stockInfo;
    quantity = Number(quantity);
    if(isNaN(quantity))
    {
        throw new AppError('Invalid Quantity!','INVALID_INPUT',409);
    }
    const outputId = cvid < 5 ? 1 : 2; // cvid == 5 means -> cake :output 2
    let connection;
    try{ 
        connection = await db.getConnection();
        await connection.beginTransaction();
    const values = await coreModel.getCoreVolumes(connection);
    const reducingValue = await quantity * Number(values[cvid - 1].value);
    console.log(reducingValue,values,values[cvid-1])
    if(quantity < 0)
    {
            const currentQuantity = await stockModel.packed.getStockQuantity(cpid,cvid,sid,connection);
            if(-quantity > currentQuantity)
            {
                throw new AppError('No stock Available at Packed!','NO_STOCK',409);
            }

    }

    
        const isAvailable = await stockModel.unpacked.isStockAvailable(cpid,outputId,sid,reducingValue,connection);
        if(!isAvailable){
               throw new AppError('No stock Available at Un Packed!','NO_STOCK',409);
        }

        await stockModel.unpacked.reduce(cpid,outputId,sid,reducingValue,connection);
        await stockModel.packed.restore(cpid,cvid,sid,quantity,connection);
        await connection.commit();
        return {success:true};
        
        
    }
    catch(err)
    {
        console.log(err);
        if(connection) await connection.rollback();
        if(err instanceof AppError) return getAppErrorResult(err);
        return getInternalErrorResult();

    }
     finally {
        if(connection) connection.release();
    }


}

const getPackedStock = async () => {
    try{
        const data = await stockModel.packed.getStock();
        return {success:true,data};
    }
    catch(err)
    {

        console.log(err);
        return  getInternalErrorResult();
    }

}

const getUnPackedStock = async () => {
     try{
        const data = await stockModel.unpacked.getStock();
        return {success:true,data};
    }
    catch(err)
    {

        console.log(err);
        return  getInternalErrorResult();
    }

}

const getProductionStock = async () => {
     try{
        const data = await stockModel.production.getStock();
        return {success:true,data};
    }
    catch(err)
    {

        console.log(err);
        return getInternalErrorResult();
    }

}

module.exports = {
    updatePackedStock,
    getPackedStock,
    getUnPackedStock,
    getProductionStock
    
}