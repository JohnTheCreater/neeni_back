const express=require('express')
const route=express.Router();

const products=require('./Products/products')
const customer=require('./customer/customer')
const bill=require('./bill/bill')
const stack=require('./stack/stack')
const productionStack=require('./stack/production')
const util=require('./util/util')
const login=require('./login/login')
route.post('/insertProduct',products.insertProduct)
route.post('/get',util.get);
route.post('/changePrice',products.changePrice)
route.get('/getLastBillNumber',bill.getLastBillNumber)
route.post('/addCustomer',customer.add_customer)
route.post('/updateCustomer',customer.updateCustomer)
route.post('/removeCustomer',customer.removeCustomer)
route.post('/checkEmail',customer.checkEmail)
route.post('/addBill',bill.addBill)
route.post('/addBottles',stack.addBottles)
route.post('/addStack',stack.addStack)

route.post('/productionAddition',productionStack.production_addition)
route.post('/productionGrinding',productionStack.production_grinding)
route.get('/getLog/:month/:year/:type',productionStack.getLog);
route.post('/undo',productionStack.undo)
route.get('/getBillCount',bill.getBillCount)
route.get('/getUserList',customer.getUserList)
route.post('/getSales',bill.getSales)

route.post('/downloadBill',bill.downloadBill)
route.post('/sendBill',bill.sendBill)
route.post('/removeProduct',products.removeProduct)
route.post('/removeBill',bill.removeBill)   
route.post('/doLogin',login.doLogin)
route.post('/setAuthInfo',login.setUsernamePassword)
route.post('/sendNotification',bill.sendNotification)
route.post("/getPaymentInfo",bill.getPaymentInfo)
route.post('/getRemainingPayment',customer.getRemainingPayment);
route.get('/getCustomers',customer.getCustomers);
route.post('/getbills',customer.getBills)


module.exports=route