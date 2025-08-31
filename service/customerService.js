const db = require('../db');
const AppError = require('../error/appError');
const customerModel = require('../model/customer');
const billModel = require('../model/bill')
const { getAppErrorResult, getInternalErrorResult } = require('../util/util');

const addCustomer = async (customer) =>{

    let connection ;
    try
    {
        connection = await db.getConnection();
        await connection.beginTransaction();

            
        if(customer.email !== process.env.ADMIN_GMAIL)
        {
            const emailExists = await customerModel.isEmailPresent(customer.email,connection);
            if(emailExists)
            {
                    throw new AppError(`Email already exists!`,'DUPLICATE_EMAIL',409); 
            }
        }
                

        const values =  [
            customer.name,
            customer.gender,
            customer.email,
            customer.mobileno,
            customer.address,
            customer.city,
            customer.state,
            customer.pincode,
            customer.gstnumber || null,
        ];

        await customerModel.addCustomer(values,connection);
        await connection.commit();
        return {success:true};
    }
    catch(err)
    {
        if(connection) { await connection.rollback();}
        console.log(err);
        if(err instanceof AppError) return getAppErrorResult(err);
        return getInternalErrorResult();
    }
     finally {
        if(connection) connection.release();
    }

}


const updateCustomer = async(customer,customerId) => {

    let connection;
    try{
        connection = await db.getConnection();
        await connection.beginTransaction();

        const values =  [
      customer.name,
      customer.gender,
      customer.email,
      customer.mobileno,
      customer.address,
      customer.city,
      customer.state,
      customer.pincode,
      customer.gstnumber|| null,
      customer.is_active,
      customerId
    ]
    const isPresent = await customerModel.isEmailPresentExcept(customer.email,customerId,connection);
    if(customer.email !== process.env.ADMIN_GMAIL && isPresent)
    {
            throw new AppError("This mail is already taken! Select new one!",'DUPLICATE_MAIL',400);
    }

        await customerModel.updateCustomer(values,connection);
        await connection.commit();
        return { success:true};
    }
    catch(err)
    {
        if(connection) { await connection.rollback();}
        console.log(err);
        if(err instanceof AppError)
            return getAppErrorResult(err);
        return getInternalErrorResult();
    }
     finally {
        if(connection) connection.release();
    }

}

const removeCustomer = async (customerId)=>{

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        const result = await billModel.getBillsByCustomerId(customerId);
        if(result.length > 0)
        {
            throw new AppError('Cannot Remove Customer : The Customer is Associated with Bills!','NOT_VALID_ACTION',409);
        }
        await customerModel.hardRemoveCustomer(customerId,connection);
        console.log('customer deleted !');
        await connection.commit();
        return {success:true};
    }
    catch(err)
    {
        if(connection) { await connection.rollback();}
        if(err instanceof AppError) return getAppErrorResult(err);
        console.log(err);
        return getInternalErrorResult();
    }
     finally {
        if(connection) connection.release();
    }


}

const activateCustomer = async (inActiveCustomerId) =>{
    try{
        await customerModel.activateCustomer(inActiveCustomerId);
        console.log('customer activated!',inActiveCustomerId);
        return {success:true};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}

const getActiveCustomers = async(value)=>{
    try{

        const data =  await customerModel.getActiveCustomers(value.trim());
        return { success:true , data};

    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}



const getActiveCustomersWithPaymentInfo = async (limit,offset,value) =>{
    try {
        const data =  await customerModel.getCustomersWithPaymentInfo(limit,offset,value);
        return {success : true, data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();

    }
    
}

const getInActiveCustomers = async()=>{

    try{
    const data = await customerModel.getInActiveCustomers();
    return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return  getInternalErrorResult();
    }
}

const getCustomers = async (value)=>{
    try{
        const data =  await customerModel.getCustomers(value.trim());
        return { success:true, data};

    }
    catch(err){
        console.log(err);
        return getInternalErrorResult();
    }
    
}

const isEmailExists = async(email)=>{

    try {
        if(email === process.env.ADMIN_GMAIL)
            return {success:true,isExist:false};

        const isExist = await customerModel.isEmailPresent(email);
        return {success:true,isExist};
    }
    catch(err)
    {
        console.log(err);
        return  getInternalErrorResult();
    }
}



module.exports = {
    addCustomer,
    updateCustomer,
    removeCustomer,
    activateCustomer,
    getActiveCustomers,
    getActiveCustomersWithPaymentInfo,
    getInActiveCustomers,
    getCustomers,
    isEmailExists

}