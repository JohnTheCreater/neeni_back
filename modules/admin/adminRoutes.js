const express = require('express');
const route = express.Router();
const controller = require('./adminController')

route.put('/updateCredentials',controller.updateCredentials);



module.exports = route;
