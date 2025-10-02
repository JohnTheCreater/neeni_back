const express = require('express');
const route = express.Router();

const controller = require('./productionController');

route.get('/',controller.getProductionProducts)
route.post('/addRaw',controller.addRaw);
route.post('/doGrind',controller.doGrind);
route.post('/doTransaction',controller.doTransaction);

module.exports = route;