const productionService = require('../service/productionService');
const { getErrorResponse } = require('../util/util');


const addRaw = async(req,res) => {

    const {rawData} = req.body;

    const result = await productionService.addRaw(rawData);
    if(result.success) return res.status(200).json({message:'Production Addition Successfull!'});
    console.log('returnes ',result)
    return getErrorResponse(res,result);

    

}

const doGrind = async(req,res) => {

    const {grindData} = req.body;
    const result = await productionService.doGrind(grindData);
    if(result.success) return res.status(200).json({message:'Production Grind Successfull!'});
    return getErrorResponse(res,result);


}

const doTransaction = async(req,res) => {

    const transactionData = req.body;
     const result = await productionService.doTransaction(transactionData);
    if(result.success) return res.status(200).json({message:'Production Transaction Successfull!'});
    return getErrorResponse(res,result);



}

const getProductionProducts = async(req,res)=>{
    const result = await productionService.getProductionProducts();
    if(result.success) return res.status(200).json(result.data);
    return getErrorResponse(res,result);
}

module.exports = {
    addRaw,
    doGrind,
    doTransaction,
    getProductionProducts
}