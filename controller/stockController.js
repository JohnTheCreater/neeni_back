const stockService = require('../service/stockService');
const { getErrorResponse } = require('../util/util');

const changePackedStock = async(req,res) => {

    const stockInfo = req.body;
    const result = await stockService.updatePackedStock(stockInfo);
    if(result.success) return res.status(200).json({message:'packed stock updated!'});
    console.log(result);
    return getErrorResponse(res,result);
}

const getPackedStock = async(req,res) => {
    const result = await stockService.getPackedStock();
    if( result.success ) return res.status(200).json(result.data);
    return getErrorResponse(res,result);
}


const getUnPackedStock = async(req,res) => {
    const result = await stockService.getUnPackedStock();
    if( result.success ) return res.status(200).json(result.data);
    return getErrorResponse(res,result);
}
const getProductionStock = async(req,res) => {
    const result = await stockService.getProductionStock();
    if( result.success ) return res.status(200).json(result.data);
    return getErrorResponse(res,result);
}

module.exports = {
     changePackedStock,
     getPackedStock,
     getUnPackedStock,
     getProductionStock
    };