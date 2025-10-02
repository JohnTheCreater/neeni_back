const express = require('express');
const route = express.Router();

const controller = require('./productController');

route.post('/',controller.addProduct);
route.delete('/:productId',controller.removeProduct);
route.post('/activate',controller.activateProduct);
route.put('/:productId',controller.updateProduct);
route.get('/',controller.getProducts);
route.get('/active',controller.getActiveProducts);
route.get('/inActive',controller.getInActiveProducts);

module.exports = route;