
const customerService = require('../service/customerService');
const { getErrorResponse } = require('../util/util');

const addCustomer = async (req,res) => {

    const {customer} = req.body;
    const result = await customerService.addCustomer(customer);
    if(result.success)
    {
        return res.status(200).json({message:'customer is added!'})
    }
 
    return getErrorResponse(res,result);
    

}

const updateCustomer = async (req,res) => {

    const {customer} = req.body;
    const {customerId} = req.params
    const result = await customerService.updateCustomer(customer,customerId);
    if(result.success)
    {
        return res.status(200).json({message:'customer data updated!'})
    }
   
    return getErrorResponse(res,result);
    
}
const removeCustomer = async (req,res) => {
    
    const {customerId} = req.params;
    console.log(customerId)
    const result = await customerService.removeCustomer(customerId);
    if(result.success)
    {
        return res.status(200).json({message:'customer has been deleted!'})
    }
    
    return getErrorResponse(res,result);
    

}

const getCustomers = async (req,res) => {

    const value = (req.query.value || "").trim();
    const result = await customerService.getCustomers(value);
    if(result.success)
    {
        return res.status(200).json(result.data);
    }
   
    return getErrorResponse(res,result);

    
}

const getCustomersPageData = async(req,res) => {

    const limit = Number(req.query.limit) || 10;
    const offset = req.query.page ? (Number(req.query.page) - 1) * limit : 0;
    const value = (req.query.value || "").trim();

    const result = await customerService.getActiveCustomersWithPaymentInfo(limit,offset,value.trim());
    if(result.success)
    {
        return res.status(200).json(result.data);
    }
    return getErrorResponse(res,result);
}

const getActiveCustomers = async (req,res) => {

    const value = (req.query.value || "").trim();
    const result = await customerService.getActiveCustomers(value);

    if(result.success)
    {
        return res.status(200).json(result.data);
    }
    
    return  getErrorResponse(res,result);


    

}

const checkEmail = async(req,res) => {
    const {email} = req.body;
    const result = await customerService.isEmailExists(email);
    if(result.success)
    {
        return res.status(200).json({isExist:result.isExist});
    }
    return  getErrorResponse(res,result);
}


module.exports = { 
    addCustomer,
    updateCustomer,
    removeCustomer,
    getCustomers,
    getActiveCustomers,
    getCustomersPageData,
    checkEmail

}
