const productModel = require('../model/product');
const coreModel = require('../model/core');
const db = require('../db');
const productType = require('../types/productType')
const AppError = require('../error/appError');
const { getAppErrorResult, getInternalErrorResult } = require('../util/util');


const addProduct = async(productName,type,priceDetails)=>{
    
    let connection;
    try {
            connection = await db.getConnection();
            await connection.beginTransaction();
            
            if(!productName || typeof productName !== 'string') {
                throw new AppError('Invalid Product Name!','INVALID_INPUT',409);
            }
            
            const trimmedProductName = productName.trim();
            if(!trimmedProductName)
            {
                throw new AppError('Invalid Product Name!','INVALID_INPUT',409);
            }
            const isExist = await productModel.getProductLike(trimmedProductName,type,connection);
            if(isExist)
            {
                throw new AppError('Product Already Exist!','ER_DUP_ENTRY',400);
            }
            let lastProductId = await productModel.getLastProductId(connection);
            console.log(type,productType.MAIN_PRODUCTS_TYPE,type === productType.MAIN_PRODUCTS_TYPE)
            if(type === productType.MAIN_PRODUCTS_TYPE )
            {
                await handleMainProductAddition(trimmedProductName,type,priceDetails,lastProductId,connection);
            }
            else
            {
                const price = priceDetails.price;
                await handleSecondaryProductAddition(trimmedProductName,type,price,lastProductId,connection);
            }
            await connection.commit()
            console.log('Product has been Added!');
            
            return {success:true};
    }
    catch(err)
    {
       if(connection) await connection.rollback();
        console.log('Error adding product : ',err);

        if(err instanceof AppError) return getAppErrorResult(err);
        return getInternalErrorResult();

    }
     finally {
        if(connection) connection.release();
    }
 
}

const handleSecondaryProductAddition = async(productName,type,price,lastProductId,connection) => {

    return await productModel.addProduct(lastProductId+1,productName,price,type,connection);
    

}


const handleMainProductAddition = async(productName,type,priceDetails,lastProductId,connection) =>{


    console.log(priceDetails)
    const volumes = await coreModel.getCoreVolumes();
    const products = await coreModel.getCoreProducts();
      let idCounter = lastProductId;
      for (const product of products) {
        for (const volume of volumes) {
          if (priceDetails[product.id] && priceDetails[product.id][volume.id]) {
            idCounter++;
            const name = `${product.name} ${volume.name} ${productName}`;
        
              await productModel.addProduct(idCounter,name,priceDetails[product.id][volume.id],type,connection);
              await coreModel.addTypeOneInfo(idCounter,product.id,volume.id,connection);
        
          }
        }
      }
     
    
}

const updatePrice = async(productId,price) => {

    try{
        const numPrice = Number(price);
        if(isNaN(numPrice))
        {
            throw new AppError('Invalid Input!','INVALID_INPUT',409);
        }
        await productModel.updatePrice(productId,numPrice);
        console.log('price updated!');
        return { success:true };
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}

const removeProduct = async (productId) => {
    try{
        const [result] = await productModel.softRemoveProduct(productId);
        if(result.affectedRows === 0)
        {
            throw new AppError('No Product Found!','INVALID_INPUT',400);
        }
        return {success:true};

    }
    catch(err)
    {
        console.log(err);
        if(err instanceof AppError) return getAppErrorResult(err);
        return getInternalErrorResult();
    }
}


const activateProduct = async (inActiveProductId)  => {

    try{
        await productModel.activateProduct(inActiveProductId);
        return {success:true};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}

const getActiveProducts = async (value) => {

    

    try{
        const data =  await productModel.getActiveProducts(value);
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();

    }
}

const getInActiveProducts = async (value) => {
    try{
        const data =  await productModel.getInActiveProducts(value);
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}

const getAllProducts = async () => {
    try{
        const data =  await productModel.getProducts();
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();

    }
}



module.exports = {
    addProduct,
    removeProduct,
    updatePrice,
    activateProduct,
    getActiveProducts,
    getInActiveProducts,
    getAllProducts

}
