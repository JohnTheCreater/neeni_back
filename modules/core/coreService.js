const coreModel = require('./core');
const { getInternalErrorResult } = require('../util/util');


const getCoreProducts = async()=>{
    try{
        const data = await coreModel.getCoreProducts();
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}

const getCoreVolumes = async()=>{
    try{
        const data = await coreModel.getCoreVolumes();
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}

const getShops = async()=>{
    try{
        const data = await coreModel.getShops();
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}

const getOutputs = async()=>{
     try{
        const data = await coreModel.getOutputs();
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}

module.exports = { 
    getCoreProducts,
    getCoreVolumes,
    getShops,
    getOutputs,
}