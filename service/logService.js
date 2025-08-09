
const productionModel = require('../model/production'); 
const logType = require('../types/logType');
const stockModel = require('../model/stock');
const db = require('../db');
const { getInternalErrorResult, getAppErrorResult } = require('../util/util');
const AppError = require('../error/appError');

const getProductionLog = async (month , year) =>{


    try {

        const data = await productionModel.getProductionLogs(month,year);
        return {success:true,data};

    }
    catch(err)
    {
        console.log(err);
        return  getInternalErrorResult();
    }

}


const undo = async (id,type) =>{

    let connection;

    try{
        connection = await db.getConnection();
        await connection.beginTransaction();
        let log;
        console.log(type,logType.ADD,type == logType.ADD);
        switch(type)
        {
            case logType.ADD:
                log = await productionModel.getAdditionLogById(id,connection);
                await stockModel.production.reduce(log.cpid,log.ppid,log.quantity,connection);
                await productionModel.removeAdditionLog(log.id,connection);
                break;
            case logType.GRIND:
                log = await productionModel.getGrindLogById(id,connection);
                await stockModel.production.restore(log.cpid,3,log.used_raw,connection);
                await stockModel.production.reduce(log.cpid,1,log.produced_oil,connection);
                await stockModel.production.reduce(log.cpid,2,log.produced_cake,connection);
                if(log.cpid === 1)
                    { await stockModel.production.restore(1,4,log.used_karupatti,connection);}
                await productionModel.removeGrindLog(log.id,connection);

                break;
            case logType.TRANSACTION:
                log = await productionModel.getTransactionLogById(id,connection);
                await stockModel.unpacked.reduce(log.cpid,log.opid,log.sid,log.quantity,connection);
                await stockModel.production.restore(log.cpid,log.opid,log.quantity,connection);
                await productionModel.removeTransactionLog(log.id,connection);
                break;
            default:
                throw new AppError('Invalid Log Type!','INVALID_INPUT',400);
        }
        await connection.commit();
        return {success:true};
    }
    catch(err) {
        if(connection) await connection.rollback();
        console.log(err);
        if(err instanceof AppError) return getAppErrorResult(err);
        return getInternalErrorResult();
    }
     finally {
        if(connection) connection.release();
    }

}


module.exports = {
    getProductionLog,
    undo
}