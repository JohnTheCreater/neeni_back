const productionModel = require('./production');
const stockModel = require('../stock/stock');
const db = require('../../db');
const AppError = require('../error/appError');
const { getAppErrorResult, getInternalErrorResult,getFormatedDate } = require('../util/util');

const addRaw = async ( rawData ) =>{ 

    const {ppid,cpid,quantity,date} = rawData;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        if(quantity < 0)
        {
            const oldQuantity = await stockModel.production.getStockQuantity(cpid,ppid,connection);
            if(-quantity > oldQuantity)
            {
                throw new AppError('No Stock Available at Production!','NO_STOCK',409);
            }
        }

    await stockModel.production.restore(cpid,ppid, Number(quantity),connection);
    await productionModel.addAdditionLog(
        cpid,
         ppid,
        quantity,
       getFormatedDate(date),
        connection
      );
      await connection.commit();
      return {success:true};


  } catch (err) {
    if(connection) await connection.rollback();
    console.log(err);
     if(err instanceof AppError)
        return  getAppErrorResult(err);

    return getInternalErrorResult()
    
  }
  finally {
        if(connection) connection.release();
    }


}

const doGrind = async (grindData)=> {

    const {date,cpid,used,grind,karupatti,producedOil,producedCake} = grindData;
    let connection;
    try{
        connection = await db.getConnection();
        await connection.beginTransaction();
        let karupattiValue =  karupatti ? Number(karupatti) : 0;

        const rawStockQuantity = await stockModel.production.getStockQuantity(cpid,3,connection);

        if (rawStockQuantity < Number(used)) {
                throw new AppError('No Stock Available!','NO_STOCK',409);
            }

        if (cpid === 1 && "karupatti" in grindData) {

            const karupattiStock = await stockModel.production.getStockQuantity(cpid,4,connection);

            if ( karupattiStock  < karupattiValue) {
                throw new AppError('No Stock Available at Production!','NO_STOCK',409);
            }
            await stockModel.production.reduce(cpid,4,karupattiValue,connection);

            }
        
            await stockModel.production.restore(cpid,1,producedOil,connection);
            await stockModel.production.restore(cpid,2,producedCake,connection);
            await stockModel.production.reduce(cpid,3,used,connection);

   

        await productionModel.addGrindLog(
            cpid,
            used,
            karupattiValue,
            grind,
            producedOil,
            producedCake,
        getFormatedDate(date),
            connection
        );
        await connection.commit();

  
    return {success:true};
}
catch(err)
{
    if(connection) await connection.rollback();
    console.log(err)

    if(err instanceof AppError)
        return getAppErrorResult(err);

    return getInternalErrorResult();
}
finally {
        if(connection) connection.release();
    }

}

const doTransaction = async(transactionData)=>{

    console.log(transactionData);
    let { cpid , opid , sid , quantity , date } = transactionData;
    quantity = Number(quantity);

    let connection;
    try{
        connection = await db.getConnection();
        await connection.beginTransaction();
        if(isNaN(quantity))
        {
            throw new AppError('Invalid Quantity!','INVALID_INPUT',409);

        }
        else if(quantity < 0)
        {
            const oldQuantity = await stockModel.unpacked.getStockQuantity(cpid,opid,sid,connection);
            if(-quantity > oldQuantity)
            {
                throw new AppError('No Stock Available at Store!','NO_STOCK',409);
            }
        }

        const result = await stockModel.production.isStockAvailable(cpid,opid,quantity,connection);

        if(!result)
        {
            throw new AppError('No Stock Available at Production!','NO_STOCK',409);
        }
        await stockModel.production.reduce(cpid,opid,quantity,connection);
        await stockModel.unpacked.restore(cpid,opid,sid,quantity,connection);
        await productionModel.addTransactionLog(cpid,opid,sid,quantity,getFormatedDate(date),connection);
        await connection.commit();
        return {success:true};

    }
    catch(err)
    {
        if(connection) await connection.rollback();
        console.log(err);
        if(err instanceof AppError)
                    return getAppErrorResult(err);

        return getInternalErrorResult();
    }
    finally {
        if(connection) connection.release();
    }

}

const getProductionProducts = async()=>{
    try{
        const data = await productionModel.getProductionProducts();
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}



module.exports = {
    addRaw,
    doGrind,
    doTransaction,
    getProductionProducts
}








