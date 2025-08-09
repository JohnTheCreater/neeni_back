const salesService = require('../service/salesService');
const { getErrorResponse } = require('../util/util');


const getSalesByBillNumber = async(req,res) => {
    const {billNumber} = req.params;
    const result = await salesService.getSalesByBillNumber(billNumber);
    if(result.success) return res.status(200).json(result.data);

    return getErrorResponse(res,result);
}

module.exports = {getSalesByBillNumber};