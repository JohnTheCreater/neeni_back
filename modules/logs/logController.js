const logService = require('./logService');
const { getErrorResponse } = require('../util/util');


const undo = async (req,res) => {
    const { id,type } = req.body;
    const result = await logService.undo(id,type);
    if(result.success) return res.status(200).json({message:'undo compleated!'});
    return getErrorResponse(res,result);
}


const getProductionLogs = async (req,res) => {
    const {month,year} = req.params;
    const result = await logService.getProductionLog(month,year);
    if(result.success) return res.status(200).json(result.data);

    return getErrorResponse(res,result);
}


module.exports = {
    undo,
    getProductionLogs
}