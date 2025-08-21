const db = require('../db');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const dayjs = require('dayjs');
const billModel = require('../model/bill');
const salesModel = require('../model/sales');
const coreModel = require('../model/core');
const productModel = require('../model/product');
const customerModel = require('../model/customer');

const {createInvoice} = require('../invoice/createInvoice');

const stockModel = require('../model/stock');
const AppError = require('../error/appError');
const { getInternalErrorResult, getAppErrorResult, getFormatedDate } = require('../util/util');


const addBill = async(billData) => {

    console.log(billData);
    let connection;
    try {
        const { billNumber,customerId, purchaseList, shopId, date, paidAmount, billAmount } = billData;
        connection = await db.getConnection();
        await connection.beginTransaction()

        const purchaseMap = await createPurchaseMap(purchaseList);
        console.log(purchaseMap,shopId)
        const isAvailable = await isStockAvailable(purchaseMap,shopId,connection);
        console.log(isAvailable)
        if (!isAvailable) {
            throw new AppError('No Stock Found In Packed !','NO_STOCK',409);
        }
        const formatedDate = getFormatedDate(date);
         await billModel.addBill({
            billNumber,
            customerId, 
            shopId, 
            date:formatedDate, 
            paidAmount, 
            billAmount
        }, connection);

        
        const saleData = purchaseList.map(element => [
            element.pid,
            Number(element.quantity),
            element.paid_status,
            billNumber, 
            element.price,
            element.sub_total
        ]);
        
        await salesModel.addSales(saleData, connection);

       await reduceStock(purchaseMap,shopId,connection);
        
        await connection.commit();

        return { 
            success: true, 
            billId: billNumber,
            message: 'Bill created successfully!'
        };

    } catch (err) {
        if(connection ) { await connection.rollback();}
        console.error('Error in addBill service:', err);
        if(err instanceof AppError) return  getAppErrorResult(err);
        return  getInternalErrorResult()
    }
     finally {
        if(connection) connection.release();
    }
};

const isStockAvailable = async(purchaseMap,shopId,connection) => {
       
    for(const[productId, info] of purchaseMap.entries()) {
        
                const { quantity ,cvid, cpid } = info;
                const isAvailable = await stockModel.packed.isStockAvailable(cpid,cvid,shopId,Number(quantity),connection);
                if(!isAvailable) return false;
            
        }

        return true;


    }


const reduceStock = async (purchaseMap,shopId,connection)=>{

       for(const[productId, info] of purchaseMap.entries()) {
        
                const { quantity ,cvid, cpid } = info;
                await stockModel.packed.reduce(cpid,cvid,shopId,Number(quantity),connection);
            
        }
        

}

const restoreStock =  async (purchaseMap,shopId,connection)=>{

      console.log('restoreStock called with:', { 
          mapSize: purchaseMap.size, 
          shopId,
          mapEntries: Array.from(purchaseMap.entries())
      });
      
      for(const[productId, info] of purchaseMap.entries()) {
        
                const { quantity ,cvid, cpid } = info;
                console.log(`Restoring stock for product ${productId}:`, { quantity, cvid, cpid, shopId });
                await stockModel.packed.restore(cpid,cvid,shopId,Number(quantity),connection);
                console.log(`Stock restored for product ${productId}`);
            
        }

}

const createPurchaseMap = async (purchaseList) => { 
    const purchaseMap = new Map();
    
    for (const item of purchaseList) {
        const productInfo = await coreModel.getProductTypeOneInfo(item.pid); 
        
        if(productInfo) {
            const currentData = purchaseMap.get(item.pid) || {
                quantity: 0,
                cpid: productInfo.cpid,
                cvid: productInfo.cvid
            };
            
            currentData.quantity += Number(item.quantity);
            purchaseMap.set(item.pid, currentData);
        }
    }
    
    return purchaseMap;
};



const updateBill = async(billData) => {
    console.log(billData);
    
     const { billNumber, customerId, purchaseList, shopId, date, paidAmount, billAmount } = billData;
    let connection;
      try { 
        connection = await db.getConnection();
        await connection.beginTransaction();
     const newSalesMap = await createPurchaseMap(purchaseList);
     const oldSales = await salesModel.getSalesByBillNumber(billNumber,connection);
     const oldSalesMap = await createPurchaseMap(oldSales);
     console.log('old ',oldSalesMap)
     const netCalculatedMap = await getNetCalculatedMap(oldSalesMap,newSalesMap);
     console.log("net calculated map : ",netCalculatedMap);
     const isAvailable = await isStockAvailable(netCalculatedMap,shopId,connection); 
     if(!isAvailable)
     {             
        throw new AppError('No Stock Found In Packed !','NO_STOCK',409);
     }

            const formatedDate =  getFormatedDate(date);

            await billModel.updateBill({
                            customerId,
                            shopId,
                            date:formatedDate,
                            billAmount,
                            paidAmount,
                            billNumber
                                        },connection);
            
            await salesModel.deleteAllSalesByBillNumber(billNumber,connection);
            const saleData = purchaseList.map(element => [
                element.pid, Number(element.quantity), element.paid_status,
                billNumber, element.price, element.sub_total
            ]);

            await salesModel.addSales(saleData,connection);
            await reduceStock(netCalculatedMap,shopId,connection);
            //old values are can be added and new extras are reduced from stack
            await connection.commit();
            return {success:true};

    }
    catch(err)
    {
        if(connection ) { await connection.rollback();}
        console.error('Error in updateBill service:', err);
        if(err instanceof AppError) return getAppErrorResult(err);
        return getInternalErrorResult();

    }
     finally {
        if(connection) connection.release();
    }
}

const getNetCalculatedMap = async (oldSalesMap,newSalesMap) => {

    const netCalculatedMap = new Map();
    for( const [productId,info] of newSalesMap.entries())
    {
       
            if(oldSalesMap.has(productId))
            {
                const oldQuantity = oldSalesMap.get(productId)?.quantity || 0;
                console.log(oldQuantity,info.quantity);
                 const netChange = Number(info.quantity) - Number(oldQuantity);
                if (netChange !== 0) {
                    netCalculatedMap.set(productId, {...info,quantity:netChange});
                }
            }
            else
            {
                netCalculatedMap.set(productId, {...info});
            }
        
       
    }

     for (const [productId, info] of oldSalesMap.entries()) {

        if (!newSalesMap.has(productId)) {
           
            netCalculatedMap.set(productId, {...info ,quantity:-Number(info.quantity)});
        }
    }
   return netCalculatedMap;
}



const removeBill = async(billNumber) => {

    let connection;
    try{
        connection = await db.getConnection();
        await connection.beginTransaction();
    const oldSales = await salesModel.getSalesByBillNumber(billNumber,connection);
    console.log('Raw oldSales from DB:', oldSales);
    const oldSalesMap = await createPurchaseMap(oldSales);
    const bill = await billModel.getBillById(billNumber,connection);
    console.log('old sales map ' ,oldSalesMap);
    console.log('Bill shop_id:', bill.shopid);
    await restoreStock(oldSalesMap,bill.shopid,connection);

    await billModel.deleteBill(billNumber,connection);
    await connection.commit();
    return {success:true}
    }
    catch(err)
    {
        if(connection ) { await connection.rollback();}
        console.log(err);
        return getInternalErrorResult();
    }
     finally {
        if(connection) connection.release();
    }


}




const generateBillPdf = async (billNumber) => {

    try {
        const bill = await billModel.getBillById(billNumber);
        const invoice = await getInvoice(bill);
        const doc = await createInvoice(invoice);
        const filePath = path.join(__dirname, "../", "invoice.pdf");
        const fileStream = fs.createWriteStream(filePath);
        
        doc.pipe(fileStream);
        doc.end();

        return new Promise((resolve, reject) => {
            fileStream.on("finish", () => {
                resolve({ success: true, filePath });
            });
            fileStream.on("error", (err) => {
                reject({ success: false, message: "Error creating PDF" });
            });
        });

    } catch (error) {
        return getInternalErrorResult();
    }
}


const getInvoice = async (bill) => {

  const sales = await salesModel.getSalesByBillNumber(bill.id);
   
  const products = await productModel.getProducts();

  const customers = await customerModel.getCustomerById(bill.customer_id);

  const total = sales.reduce((acc, item) => acc + parseInt(item.sub_total), 0);
  const paid = sales.reduce(
    (acc, item) =>
      item.paid_status === "paid" ? acc + parseInt(item.sub_total) : acc,
    0
  );

  const invoice = {
    customer: {
      name: customers?.name,
      address: customers?.address,
      mobile_no: customers?.mobileno,
      customer_gst: `gst:${customers?.gstnumber}`,
      email: customers.email,
    },
    items: sales.map((item) => {
      const product = products.find((prod) => prod.id === item.pid);
      return {
        ...item,
        item: product ? product.name : "Unknown Product",
      };
    }),
    total,
    paid,
    invoice: bill.id,
    date: new Date(bill.date),
    paidAmount:  Number(bill.paid_amount)
  };
  return invoice;
};


const sendBill = async(billNumber) => {

    try {
    const bill = await billModel.getBillById(billNumber);

    const invoice = await getInvoice(bill);
    const doc = await createInvoice(invoice);
    doc.end();
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {

    const pdfBuffer = Buffer.concat(buffers);
    const sender = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_GMAIL,
        pass: process.env.ADMIN_GMAIL_PASSKEY,
      },
    });
    console.log(invoice.customer.email);

    const composeMail = {
      from: process.env.ADMIN_GMAIL,
      to: invoice.customer.email,
      subject: `Your Bill For The Purchase On ${dayjs(bill.date).format(
        "DD-MM-YYYY"
      )}`,
      attachments: [
        {
          filename: `Neenika_${bill.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    };
    await sender.sendMail(composeMail);

});
    return { success:true};
    }
    catch(err)
    {
        console.log(err);
        return  getInternalErrorResult();
    }

}

const sendNotification = async(billNumber) => {

     try {
            
            const salesList = await salesModel.getSalesByBillNumber(billNumber);
            const productList = await productModel.getProducts();
            const bill = await billModel.getBillById(billNumber);
            const customer = await customerModel.getCustomerById(bill.customer_id);
            const sender =  nodemailer.createTransport({
                service: "gmail",
                auth: {
                user: process.env.ADMIN_GMAIL,
                pass: process.env.ADMIN_GMAIL_PASSKEY,
                },
            });

            const composeMail = {
                from: process.env.ADMIN_GMAIL,
                to: customer.email,
                subject: "Notification Of Your Purchase!",
                html: `<div>
                <div>
            <h2>Dear ${customer.name},</h2>
            <p>Thank you for purchasing!. Kindly pay the bill for unpaid products.</p>
            <h4>Date: ${dayjs(bill.date).format("DD-MM-YYYY")}</h4>
            </div>
                <table style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product name</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Quantity</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Price</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Sub Total</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Paid Status</th>
                    </tr>
                </thead>
                <tbody>
                ${salesList
                    .map((item) => {
                    const product=productList.find((prod)=>prod.id==item.pid)
                    return `
                        <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${
                        product.name
                        }</td>
                    
                        <td style="border: 1px solid #ddd; padding: 8px;">${
                        item.quantity
                        }</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${
                        item.price
                        }</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${
                        item.sub_total
                        }</td>
                    
                    
                        <td bgcolor=${item.paid_status==="paid"?"green":"red"} style="border: 1px solid #ddd; padding: 8px;">${
                        item.paid_status
                        }</td>
                    </tr>`;
                    })
                    .join("")}
                    
                </tbody>
                </table>
                </div>
            `,
            };

            await sender.sendMail(composeMail);
            return {success:true};
    }
    catch(err) 
    {
        console.log(err);
        return  getInternalErrorResult();
    }
    

}


const getNextBillNumber = async() => {

    try{
        const billNumber = await billModel.getNextBillNumber();
        console.log(billNumber)
        return {success:true,data:billNumber};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }

}

const getBills = async()=>{

    try{
        const data = await billModel.getBills();
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }
}

const getBillsByCustomerId = async(customerId)=>{
    console.log(customerId);
    try{
        const data = await billModel.getBillsByCustomerId(customerId);
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();
    }

}

const getPaymentInfoForMonth = async(date)=>{
    try{

        const data = await billModel.getPaymentInfoForMonth(date);
        return {success:true,data};
    }
    catch(err)
    {
        console.log(err);
        return getInternalErrorResult();

    }
}


module.exports = {
    addBill,
    updateBill,
    removeBill,
    generateBillPdf,
    sendBill,
    sendNotification,
    getNextBillNumber,
    getBills,
    getBillsByCustomerId,
    getPaymentInfoForMonth
}

