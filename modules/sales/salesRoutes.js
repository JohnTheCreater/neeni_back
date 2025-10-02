const express = require('express');
const route = express.Router();

const controller = require('./salesController');

route.get('/:billNumber',controller.getSalesByBillNumber);


module.exports = route;