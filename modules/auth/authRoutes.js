const express = require('express');
const route = express.Router();

const controller = require('./authController')

route.post('/login',controller.login);
route.post('/refresh',controller.refresh);
route.post('/logout',controller.logout);


module.exports = route;