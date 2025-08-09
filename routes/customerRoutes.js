const express = require('express');
const route = express.Router();
const controller = require('../controller/customerController');

route.post('/',controller.addCustomers);
route.get('/',controller.getCustomers);
route.get('/active',controller.getActiveCustomers);
route.post('/checkEmail',controller.checkEmail);

route.put('/:customerId',controller.updateCustomer);
route.delete('/:customerId',controller.removeCustomer);


module.exports = route;