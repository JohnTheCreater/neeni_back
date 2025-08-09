
const customerService = require('../service/customerService');
const { getErrorResponse } = require('../util/util');

const addCustomers = async (req,res) => {

    const {customerList} = req.body;
    const result = await customerService.addCustomers(customerList);
    if(result.success)
    {
        return res.status(200).json({message:'All customers are added!'})
    }
 
    return getErrorResponse(res,result);
    

}

const updateCustomer = async (req,res) => {

    const {customer} = req.body;
    const {customerId} = req.params
    console.log(customer,customerId);
    const result = await customerService.updateCustomer(customer,customerId);
    if(result.success)
    {
        return res.status(200).json({message:'customer data updated!'})
    }
   
    return getErrorResponse(res,result);
    
}
const removeCustomer = async (req,res) => {
    
    const {customerId} = req.params;
    const result = await customerService.removeCustomer(customerId);
    if(result.success)
    {
        return res.status(200).json({message:'customer has been deleted!'})
    }
    
    return getErrorResponse(res,result);
    

}

const getCustomers = async (req,res) => {

    const result = await customerService.getAllCustomers();
    if(result.success)
    {
        return res.status(200).json(result.data);
    }
   
    return getErrorResponse(res,result);

    

}

const getActiveCustomers = async (req,res) => {

    const result = await customerService.getActiveCustomersWithPaymentInfo();

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
    addCustomers,
    updateCustomer,
    removeCustomer,
    getCustomers,
    getActiveCustomers,
    checkEmail

}
