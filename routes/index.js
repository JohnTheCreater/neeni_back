const express = require('express');
const route = express.Router();
const { authenticateToken } = require('../middleware/auth');

const adminRoutes = require('../modules/admin/adminRoutes');
const authRoutes = require('../modules/auth/authRoutes');
const billRoutes = require('../modules/bill/billRoutes');
const customerRoutes = require('../modules/customers/customerRoutes');
const logRoutes = require('../modules/logs/logRoutes');
const productionRoutes = require('../modules/production/productionRoutes');
const productRoutes = require('../modules/products/productRoutes');
const salesRoutes = require('../modules/sales/salesRoutes');
const stockRoutes = require('../modules/stock/stockRoutes');
const coreRoutes = require('../modules/core/coreRoutes');

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