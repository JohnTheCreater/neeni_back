const stockModel = require('../model/stock')
const coreModel = require('../model/core')
const productionModel = require('../model/production');
const nodemailer = require('nodemailer');
const cron = require('node-cron')


const watchStock = ()=>{
cron.schedule('40 21 * * *',()=>{
     lookStock();
})
}



const lookStock = async() => {
    try {
        console.log('🔍 Checking stock levels...');
        
        const packedStock = await stockModel.packed.getStock();
        const unpackedStock = await stockModel.unpacked.getStock(); 
        const productionStock = await stockModel.production.getStock();
        
        const lowPackedStock = packedStock.filter(item => 
            item.quantity <= (item.threshold || 10)
        );
        
        const lowUnpackedStock = unpackedStock.filter(item => 
            item.quantity <= (item.threshold || 10)
        );
        
        const lowProductionStock = productionStock.filter(item => 
            item.quantity <= (item.threshold || 10)
        );
        
        const totalLowItems = lowPackedStock.length + lowUnpackedStock.length + lowProductionStock.length;
        
        if (totalLowItems > 0) {
            console.log(`⚠️ Found ${totalLowItems} low stock items`);
            await notify(lowPackedStock, lowUnpackedStock, lowProductionStock);
        } else {
            console.log('✅ All stock levels are sufficient');
        }
        
    } catch (error) {
        console.error('❌ Error checking stock:', error);
    }
}

const notify = async(packedStock, unpackedStock, productionStock) => { 
    try {
        const htmlContent = await generateStockAlertHTML(packedStock, unpackedStock, productionStock);

        const sender = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.ADMIN_GMAIL,
                pass: process.env.ADMIN_GMAIL_PASSKEY
            }
        });

        const composeMail = {
            from: process.env.ADMIN_GMAIL,
            to: process.env.ADMIN_GMAIL,        
            subject: '🚨 Low Stock Alert',
            html: htmlContent
        };

        await sender.sendMail(composeMail);
        console.log('📧 Stock alert email sent successfully');

    } catch (error) {
        console.error('❌ Error sending notification:', error);
    }
}

const generateStockAlertHTML = async (packedStock, unpackedStock, productionStock) => {

    const coreProducts = await coreModel.getCoreProducts();
    const coreVolumes = await coreModel.getCoreVolumes();
    const shops = await coreModel.getShops();
    const outputs = await coreModel.getOutputs();
    const productionProducts = await productionModel.getProductionProducts();

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Stock Alert</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                background-color: #f5f5f5;
                padding: 20px;
            }
            .container {
                background-color: white;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #dc3545, #ff6b7a);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            .date {
                margin-top: 10px;
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 30px;
            }
            .stock-section {
                margin-bottom: 40px;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                overflow: hidden;
            }
            .section-header {
                background-color: #f8f9fa;
                padding: 15px 20px;
                border-bottom: 1px solid #e9ecef;
            }
            .section-title {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .section-icon {
                font-size: 24px;
            }
            .stock-list {
                padding: 0;
                margin: 0;
                list-style: none;
            }
            .stock-item {
                padding: 15px 20px;
                border-bottom: 1px solid #f1f3f4;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background-color 0.2s;
            }
            .stock-item:hover {
                background-color: #f8f9fa;
            }
            .stock-item:last-child {
                border-bottom: none;
            }
            .item-names {
                font-weight: 500;
                color: #2c3e50;
                flex: 1;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                align-items: center;
            }
            .name-badge {
                background-color: #e9ecef;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 13px;
                color: #495057;
            }
            .item-quantity {
                background-color: #dc3545;
                color: white;
                padding: 5px 12px;
                border-radius: 20px;
                font-weight: bold;
                font-size: 14px;
                margin-left: 10px;
            }
            .no-alerts {
                padding: 20px;
                text-align: center;
                color: #28a745;
                font-style: italic;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
            .urgent {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .stats {
                display: flex;
                justify-content: space-around;
                background-color: #f8f9fa;
                padding: 20px;
                margin: 20px 0;
                border-radius: 8px;
            }
            .stat-item {
                text-align: center;
            }
            .stat-number {
                font-size: 24px;
                font-weight: bold;
                color: #dc3545;
            }
            .stat-label {
                font-size: 12px;
                color: #6c757d;
                margin-top: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <h1>🚨 Low Stock Alert</h1>
                <div class="date">${currentDate}</div>
            </div>

            <!-- Alert Summary -->
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-number">${packedStock.length}</div>
                    <div class="stat-label">PACKED ITEMS LOW</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${unpackedStock.length}</div>
                    <div class="stat-label">UNPACKED ITEMS LOW</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${productionStock.length}</div>
                    <div class="stat-label">PRODUCTION ITEMS LOW</div>
                </div>
            </div>

            <div class="content">
                ${(packedStock.length + unpackedStock.length + productionStock.length) > 0 ? 
                    '<div class="urgent">⚠️ <strong>Urgent Action Required:</strong> Multiple items are running low in stock. Please review and reorder immediately to avoid disruptions.</div>' 
                    : ''
                }

                <!-- Packed Stock Section -->
                <div class="stock-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <span class="section-icon">📦</span>
                            Packed Stock Alerts
                        </h2>
                    </div>
                    ${packedStock.length > 0 ? `
                        <ul class="stock-list">
                            ${packedStock.map(item => {
                                const coreProduct = coreProducts.find(p => p.id === item.cpid);
                                const coreVolume = coreVolumes.find(v => v.id === item.cvid);
                                const shop = shops.find(s => s.id === item.sid);

                                return `
                                <li class="stock-item">
                                    <div class="item-names">
                                        ${coreProduct?.name ? `<span class="name-badge">${coreProduct.name}</span>` : ''}
                                        ${coreVolume?.name ? `<span class="name-badge">${coreVolume.name}</span>` : ''}
                                        ${shop?.name ? `<span class="name-badge">${shop.name}</span>` : ''}
                                    </div>
                                    <span class="item-quantity">${item.quantity || 0} left</span>
                                </li>
                            `}).join('')}
                        </ul>
                    ` : `
                        <div class="no-alerts">✅ All packed stock levels are sufficient</div>
                    `}
                </div>

                <!-- Unpacked Stock Section -->
                <div class="stock-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <span class="section-icon">📋</span>
                            Unpacked Stock Alerts
                        </h2>
                    </div>
                    ${unpackedStock.length > 0 ? `
                        <ul class="stock-list">
                            ${unpackedStock.map(item => {
                                const coreProduct = coreProducts.find(p => p.id === item.cpid);
                                const output = outputs.find(o => o.id === item.opid);
                                const shop = shops.find(s => s.id == item.sid);

                                return `
                                <li class="stock-item">
                                    <div class="item-names">
                                        ${coreProduct?.name ? `<span class="name-badge">${coreProduct.name}</span>` : ''}
                                        ${output?.name ? `<span class="name-badge">${output.name}</span>` : ''}
                                        ${shop?.name ? `<span class="name-badge">${shop.name}</span>` : ''}
                                    </div>
                                    <span class="item-quantity">${item.quantity || 0} left</span>
                                </li>
                            `}).join('')}
                        </ul>
                    ` : `
                        <div class="no-alerts">✅ All unpacked stock levels are sufficient</div>
                    `}
                </div>

                <!-- Production Stock Section -->
                <div class="stock-section">
                    <div class="section-header">
                        <h2 class="section-title">
                            <span class="section-icon">🏭</span>
                            Production Stock Alerts
                        </h2>
                    </div>
                    ${productionStock.length > 0 ? `
                        <ul class="stock-list">
                            ${productionStock.map(item => {
                                const productionProduct = productionProducts.find(p => p.id === item.ppid);
                                const coreProduct = coreProducts.find(p => p.id == item.cpid);
                                return `
                                <li class="stock-item">
                                    <div class="item-names">
                                    
                                        ${coreProduct?.name  && productionProduct.id != 4 ? `<span class="name-badge">${coreProduct.name}</span>` : ''}
                                        ${productionProduct?.name ? `<span class="name-badge">${productionProduct.name}</span>` : ''}
                                    </div>
                                    <span class="item-quantity">${item.quantity || 0} left</span>
                                </li>
                            `}).join('')}
                        </ul>
                    ` : `
                        <div class="no-alerts">✅ All production stock levels are sufficient</div>
                    `}
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>This is an automated alert from your Inventory Management System</p>
                <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = { watchStock };