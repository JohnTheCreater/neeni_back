const coreService = require('../service/coreService');
const { getErrorResponse } = require('../util/util');


const getCoreProducts = async(req,res)=>{
    const result = await coreService.getCoreProducts();
    if(result.success) return res.status(200).json(result.data);
    return getErrorResponse();
}

const getCoreVolumes = async(req,res)=>{
    const result = await coreService.getCoreVolumes();
    if(result.success) return res.status(200).json(result.data);
    return getErrorResponse();
}


const getShops = async(req,res)=>{
    const result = await coreService.getShops();
    if(result.success) return res.status(200).json(result.data);
    return getErrorResponse();
}

const getOutputs =async(req,res)=>{
    const result = await coreService.getOutputs();
      if(result.success) return res.status(200).json(result.data);
    return getErrorResponse();

}

module.exports = {
    getCoreProducts,
    getCoreVolumes,
    getShops,
    getOutputs
}