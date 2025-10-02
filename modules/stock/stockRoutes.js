const express = require('express');
const route = express.Router();

const controller = require('./stockController');

route.patch('/updatePackedStock',controller.changePackedStock);
route.get('/packed',controller.getPackedStock);
route.get('/unpacked',controller.getUnPackedStock);
route.get('/production',controller.getProductionStock);



module.exports = route;