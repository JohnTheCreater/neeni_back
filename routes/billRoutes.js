const express = require('express');
const route = express.Router();

const controller = require('../controller/billController');

route.post('/', controller.addBill);
route.get('/', controller.getBills);
route.get('/getNextBillNumber', controller.getNextBillNumber); 
route.get('/download/:billNumber', controller.downloadBill);
route.get('/paymentInfo/:date', controller.getPaymentInfoForMonth);

route.get('/:customerId', controller.getBillsByCustomerId);
route.put('/:billNumber', controller.updateBill);
route.delete('/:billNumber', controller.removeBill);

route.post('/send', controller.sendBill);
route.post('/notifyCustomer', controller.sendNotification);

module.exports = route;