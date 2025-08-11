const express = require('express');
const route = express.Router();
const { authenticateToken } = require('../middleware/auth');

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

route.use('/auth', authRoutes);

route.use('/admin', authenticateToken, adminRoutes);
route.use('/bill', authenticateToken, billRoutes);
route.use('/customer', authenticateToken, customerRoutes);
route.use('/log', authenticateToken, logRoutes);
route.use('/production', authenticateToken, productionRoutes);
route.use('/product', authenticateToken, productRoutes);
route.use('/sales', authenticateToken, salesRoutes);
route.use('/stock', authenticateToken, stockRoutes);
route.use('/core', authenticateToken, coreRoutes);


module.exports = route;