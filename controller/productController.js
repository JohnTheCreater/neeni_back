
const productService = require('../service/productService');
const { getErrorResponse } = require('../util/util');

const addProduct = async(req,res)=>{

    const {productName,type,priceDetails} = req.body;
    
    const result = await productService.addProduct(productName.trim(),type,priceDetails);
    if(result.success) return res.status(200).json({message:'Product Added Successfully!'});

    return getErrorResponse(res,result);

}

const removeProduct = async(req,res)=>{

    const {productId} = req.params;
    const result = await productService.removeProduct(productId);
    if(result.success) return res.status(200).json({message:'Product Removed Successfully!'});

    return getErrorResponse(res,result);
}
const updateProduct = async(req,res)=>{

    const {price} = req.body; 
    const {productId} = req.params;
    const result = await productService.updatePrice(productId,price);
    if(result.success) return res.status(200).json({message:'Product price updated Successfully!'});

    return getErrorResponse(res,result);
}


const getProducts = async(req,res) => {

    const result = await productService.getAllProducts();

    if(result.success) return res.status(200).json(result.data);

    return getErrorResponse(res,result);



}

const getActiveProducts = async (req,res) => {

    const result = await productService.getActiveProducts();

    if(result.success) return res.status(200).json(result.data);

    return getErrorResponse(res,result);

}

const getInActiveProducts = async (req,res) => {

    
    const result = await productService.getInActiveProducts();

    if(result.success) return res.status(200).json(result.data);

    return getErrorResponse(res,result);

}

const activateProduct = async(req,res)=>{
    const {inActiveProductId} = req.body;
    const result = await productService.activateProduct(inActiveProductId);
    if(result.success) return res.status(200).json({message:'Product Acivated!'});
    return getErrorResponse(res,result);
}


module.exports = {
    addProduct,
    removeProduct,
    activateProduct,
    updateProduct,
    getProducts,
    getActiveProducts,
    getInActiveProducts
}
