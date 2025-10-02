const express = require('express');
const route = express.Router();

const controller = require('./logController')

route.post('/undo',controller.undo);
route.get('/:month/:year',controller.getProductionLogs);

module.exports = route;
