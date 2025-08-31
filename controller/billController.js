const billService = require('../service/billService');
const { getErrorResponse } = require('../util/util');

const addBill = async (req,res) => {

    const newBillData = req.body;
    const result = await billService.addBill(newBillData);
    if(result.success) return res.status(200).json(result);

    return getErrorResponse(res,result);

}


const removeBill = async(req,res) => {

    const {billNumber} = req.params;
    const result = await billService.removeBill(billNumber);
    if(result.success) return res.status(200).json({message:'Bill Removed Successfully!'});

    return getErrorResponse(res,result);


}

const updateBill = async (req,res) => {

    const {billNumber} = req.params;
    const billData = req.body;
    const result = await billService.updateBill({...billData,billNumber});
    if(result.success) return res.status(200).json({message:'Bill Updated Successfully!'});

    return getErrorResponse(res,result);
    

}

const getBills = async ( req,res) => {

    const result = await billService.getBills();
    if(result.success) return res.status(200).json(result.data);
    return getErrorResponse(res,result);

}
const getActiveBills = async ( req,res) => {


    const result = await billService.getActiveBills();
    if(result.success) return res.status(200).json(result.data);
    return getErrorResponse(res,result);

}

const getActiveBillsPage = async(req,res)=>{

    const limit = Number(req.query.limit) || 10;
    const offset = req.query.page ? (Number(req.query.page)-1) * limit : 0;
    const value = (req.query.value || "").trim();
    const result = await billService.getActiveBillsPage(limit,offset,value);
    if(result.success) return res.status(200).json(result.data);
    return getErrorResponse(res,result);

}

const getBillsInRange = async (req,res) => {

    const {month,year,shopId} = req.params;
    const limit = Number(req.query.limit) || 10;
    const offset = req.query.page ? (Number(req.query.page)-1) * limit : 0;
    const startDate = new Date(Number(year), Number(month), 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(Number(year), Number(month) + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    console.log(startDate)
    console.log(endDate)
    const result = await billService.getBillsInRange(startDate,endDate,limit,offset,shopId);

    if(result.success) return res.status(200).json(result.data);
    return getErrorResponse(res,result);

}

const getBillByBillNumber = async(req,res)=>{

    const {billNumber} = req.params;
    console.log(billNumber)
    const result = await billService.getBillByBillNumber(Number(billNumber));
    if(result.success) return res.status(200).json(result.data);
    return getErrorResponse(res,result);
}


const getBillsByCustomerId = async(req,res) => {

    const {customerId} = req.params;
    const limit = Number(req.query.limit) || 10;
    const offset = req.query.page ? (Number(req.query.page)-1) * limit : 0;
    const result = await billService.getBillsByCustomerIdPage(customerId,limit,offset);
    if(result.success) return res.status(200).json(result.data);
    return getErrorResponse(res,result);


}


const downloadBill = async(req,res)=>{
    try {
        const {billNumber} = req.params;
        if (!billNumber) {
            return res.status(400).json({
                success: false,
                message: 'Bill number is required'
            });
        }
        const result = await billService.generateBillPdf(billNumber);
        
        if(result.success) {
            res.download(result.filePath, `Neenika_Bill_${billNumber}.pdf`, (err) => {
                if (err) {
                    console.error('Download error:', err);
                } else {
                    console.log('Download completed successfully');
                    const fs = require('fs');
                    fs.unlink(result.filePath, (unlinkErr) => {
                        if (unlinkErr) console.error('File cleanup error:', unlinkErr);
                    });
                }
            });
        } else {
            return  getErrorResponse(res, result);
        }
    } catch (error) {

        console.error('Download controller error:', error);
        return res.status(500).json({
            success: false,  
            message: 'Internal server error'
        });
    }
}

const sendBill = async(req,res)=>{

    const {billNumber} = req.body;
    const result = await billService.sendBill(billNumber);
    if(result.success) return res.status(200).json({message:'Mail Sent Succesfully!'});

    return  getErrorResponse(res,result);
    

}

const sendNotification = async(req,res)=>{

    const {billNumber} = req.body;
    const result = await billService.sendNotification(billNumber);
    if(result.success) return res.status(200).json({message:'The customer Notified for the Bill status'});
    return getErrorResponse(res,result);

}

const getNextBillNumber = async(req,res)=>{

    const result = await billService.getNextBillNumber();
    if(result.success) return res.status(200).json(result.data);

    return getErrorResponse(res,result);

}



module.exports = {
    addBill,
    removeBill,
    sendBill,
    updateBill,
    downloadBill,
    sendNotification,
    getBills,
    getActiveBills,
    getBillsInRange,
    getActiveBillsPage,
    getBillByBillNumber,
    getBillsByCustomerId,
    getNextBillNumber,
    
}