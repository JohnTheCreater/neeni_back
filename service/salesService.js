const salesModel = require('../model/sales');
const { getInternalErrorResult } = require('../util/util');

const getSalesByBillNumber = async(billNumber) => {

    try{
        const data = await  salesModel.getSalesByBillNumber(billNumber);
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}

module.exports = { getSalesByBillNumber};