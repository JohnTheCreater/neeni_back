const express = require('express');
const route = express.Router();

const controller = require('../controller/billController');

route.post('/', controller.addBill);
route.get('/', controller.getBills);

route.get('/active',controller.getActiveBills);
route.get('/active/search',controller.getActiveBillsPage);
route.get('/active/:month/:year/:shopId',controller.getBillsInRange)
route.get('/getNextBillNumber', controller.getNextBillNumber); 
route.get('/download/:billNumber', controller.downloadBill);
route.get('/:billNumber',controller.getBillByBillNumber)
route.get('/customer/:customerId', controller.getBillsByCustomerId);
route.put('/:billNumber', controller.updateBill);
route.delete('/:billNumber', controller.removeBill);
route.post('/send', controller.sendBill);
route.post('/notifyCustomer', controller.sendNotification);

module.exports = route;