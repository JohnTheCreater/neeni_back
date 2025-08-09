const express = require('express');
const route = express.Router();


const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const billRoutes = require('./billRoutes');
const customerRoutes = require('./customerRoutes');
const logRoutes = require('./logRoutes');
const productionRoutes = require('./productionRoutes');
const productRoutes = require('./productRoutes');
const salesRoutes = require('./salesRoutes');
const stockRoutes = require('./stockRoutes');
const coreRoutes = require('./coreRoutes');




route.use('/admin',adminRoutes);
route.use('/auth',authRoutes);
route.use('/bill',billRoutes);
route.use('/customer',customerRoutes);
route.use('/log',logRoutes);
route.use('/production',productionRoutes);
route.use('/product',productRoutes);
route.use('/sales',salesRoutes);
route.use('/stock',stockRoutes);
route.use('/core',coreRoutes);


module.exports = route;