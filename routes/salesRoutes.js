const express = require('express');
const route = express.Router();

const controller = require('../controller/salesController');

route.get('/:billNumber',controller.getSalesByBillNumber);


module.exports = route;