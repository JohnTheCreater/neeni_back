const express = require('express');
const route = express.Router();

const controller = require('../controller/authController')

route.post('/login',controller.login);
route.post('/refresh',controller.getRefreshToken);


module.exports = route;