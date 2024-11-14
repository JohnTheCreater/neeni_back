const express=require('express')
const route=express.Router();

const products=require('./Products/products')
const customer=require('./customer/customer')
const bill=require('./bill/bill')
const stack=require('./stack/stack')
const productonStack=require('./stack/production')
const util=require('./util/util')

route.post('/insertProduct',products.insertProduct)
route.post('/get',util.get);
route.post('/changePrice',products.changePrice)
route.get('/getLastBillNumber',products.getLastBillNumber)
route.post('/addCustomer',customer.add_customer)
route.post('/getCustomer',customer.get_customer)
route.post('/updateCustomer',customer.updateCustomer)
route.post('/removeCustomer',customer.removeCustomer)
route.post('/checkEmail',customer.checkEmail)
route.post('/addBill',bill.addBill)
route.post('/addBottles',stack.addBottles)
route.post('/addStack',stack.addStack)

route.post('/productionAddition',productonStack.production_addition)
route.post('/productionGrinding',productonStack.production_grinding)
route.get('/getLog/:startDate/:endDate',productonStack.getLog);
route.post('/undo',productonStack.undo)
route.get('/getBillCount',bill.getBillCount)
route.get('/getUserList',customer.getUserList)
route.post('/getSales',bill.getSales)

route.post('/downloadBill',bill.downloadBill)
route.post('/sendBill',bill.sendBill)



module.exports=route