const stockModel = require('../model/stock')
const coreModel = require('../model/core')
const productionModel = require('../model/production');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron')


const watchStock = () => {

    cron.schedule('1 23 * * *', () => {
        lookStock();
    })
}



const lookStock = async () => {
    
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

const notify = async (packedStock, unpackedStock, productionStock) => {
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

const generateStockAlertHTML = async (packedStock = [], unpackedStock = [], productionStock = []) => {

    const coreProducts = await coreModel.getCoreProducts();
    const coreVolumes = await coreModel.getCoreVolumes();
    const shops = await coreModel.getShops();
    const outputs = await coreModel.getOutputs();
    const productionProducts = await productionModel.getProductionProducts();
    const color = ['#f8d7da','#fff3cd', '#d1ecf1']; // red, 
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const groupedPacked = packedStock.reduce((acc, item) => {
        if (!acc[item.cpid]) {
            acc[item.cpid] = [];
        }
        const product = coreProducts.find(p => p.id === item.cpid);
        const volume = coreVolumes.find(v => v.id == item.cvid);
        const shop = shops.find(s => s.id === item.sid);
        acc[item.cpid].push({ ...item, productName: product ? product.name : '',
             shopName: shop ? shop.name : '',
              volume: volume ? volume.name : '' });

        return acc;
    }, {})
    const groupedUnPacked = unpackedStock.reduce((acc, item) => {
        if (!acc[item.cpid]) {
            acc[item.cpid] = [];
        }
        const product = coreProducts.find(p => p.id === item.cpid);
        const shop = shops.find(s => s.id === item.sid);
        const output = outputs.find(o => o.id === item.opid);

        acc[item.cpid].push({ ...item, productName: product ? product.name : '',
             shopName: shop ? shop.name : '',
              output: output ? output.name : '' ,
              unit:output.name === 'Oil' ? 'LTR' : 'KG'
            });
        return acc;

    }, {})

    const groupedProductionProduct = productionStock.reduce((acc, item) => {
        if (!acc[item.cpid]) {
            acc[item.cpid] = [];
        }
        const product = coreProducts.find(p => p.id === item.cpid);
        const productionProduct = productionProducts.find(pp => pp.id === item.ppid);

        acc[item.cpid].push({ ...item, productName: product ? product.name : '',
             productionProductName: productionProduct ? productionProduct.name : '',
             unit:productionProduct.name === 'Oil' ? 'LTR' : 'KG'
             });

        return acc;
    }, {})

    const totalAlerts = packedStock.length + unpackedStock.length + productionStock.length ;

    const urgentBlock = totalAlerts > 0 ? '<div class="urgent">⚠️ <strong>Urgent Action Required:</strong> Multiple items are running low in stock. Please review and reorder immediately to avoid disruptions.</div>' : '';

    const packedList = Object.keys(groupedPacked).map((key, index) => {

        const list = groupedPacked[key];
        return list.length > 0
            ? `<ul class="stock-list">${list.map(
                i => `<li class="stock-item" style="background-color: ${color[i.cpid - 1]};"><div class="item-names">
              <span class="name-badge">${i.productName}</span>
                <span class="name-badge">${i.volume}</span>
                <span class="name-badge">${i.shopName}</span>

            </div><span class="item-quantity">${i.quantity} left</span></li>`
            ).join("")}</ul>`
            : `<div class="no-alerts">✅ All packed stock levels are sufficient</div>`;

    });

    const unpackedList = Object.keys(groupedUnPacked).map((key, index) => {
        const list = groupedUnPacked[key];
        return list.length > 0
        ? `<ul class="stock-list">${ list.map(
            i => `<li class="stock-item" style="background-color: ${color[i.cpid - 1]};"><div class="item-names">
              <span class="name-badge">${i.productName}</span>
                <span class="name-badge">${i.output}</span>
                <span class="name-badge">${i.shopName}</span>


            </div><span class="item-quantity">${i.quantity} ${i.unit}</span></li>`
    ).join("")}</ul>`
        : `<div class="no-alerts">✅ All unpacked stock levels are sufficient</div>`;
});


    const productionList = Object.keys(groupedProductionProduct).map((key, index) => {
        const list = groupedProductionProduct[key];
        return list.length > 0
        ? `<ul class="stock-list">${list.map(
            i => `<li class="stock-item" style="background-color: ${color[i.cpid - 1]};"><div class="item-names">
              <span class="name-badge">${i.productName}</span>
             <span class="name-badge">${i.productionProductName}</span>

            </div><span class="item-quantity">${i.quantity} ${i.unit}</span></li>`
        ).join("")}</ul>`
        : `<div class="no-alerts">✅ All production stock levels are sufficient</div>`;
    });

    

    const filePath = path.join(__dirname, '../stock-alert-demo.html');
    const htmlContent = await fs.readFile(filePath, 'utf-8');

    const renderedHtml = htmlContent
    .replace('{{currentDate}}',currentDate)
    .replace('{{packedCount}}',packedStock.length)
    .replace('{{unpackedCount}}',unpackedStock.length)
    .replace('{{productionCount}}',productionStock.length)
    .replace('{{urgentBlock}}',urgentBlock)
    .replace('{{packedList}}',packedList)
    .replace('{{unpackedList}}',unpackedList)
    .replace('{{productionList}}',productionList)
    .replace('{{generatedDate}}',new Date().toLocaleDateString());

    return renderedHtml;
};

module.exports = { watchStock };