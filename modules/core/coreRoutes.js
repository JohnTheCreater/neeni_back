const express = require('express');
const route = express.Router();

const controller = require('./coreController');

route.get('/products',controller.getCoreProducts);
route.get('/volumes',controller.getCoreVolumes);
route.get('/shops',controller.getShops);
route.get('/outputs',controller.getOutputs);


module.exports = route;
