const db = require('../../db');



const packed = {

    async  getStock(connection = db) {
        const [result] = await connection.query('select * from packed_stock');
        return result;
        
    },
    async getStockQuantity( coreProductId , coreVolumeId ,shopId, connection = db){
        const [result] = await connection.query('select quantity from packed_stock where cpid = ? and cvid = ? and sid = ?', [coreProductId,coreVolumeId,shopId]);
        return result[0]?.quantity || 0;

    },
    async update(coreProductId , coreVolumeId ,shopId,quantity,connection = db){
        return await connection.query('update packed_stock set quantity = quantity + ?  where cpid = ? and cvid = ? and sid = ?',[quantity,coreProductId,coreVolumeId,shopId])

    },
    async reduce(coreProductId , coreVolumeId ,shopId,quantity,connection = db){
        return await this.update( coreProductId, coreVolumeId, shopId, -quantity , connection);

    },
    async restore(coreProductId , coreVolumeId ,shopId,quantity,connection = db){
        return await this.update( coreProductId, coreVolumeId, shopId, +quantity , connection);

    },
    async isStockAvailable(coreProductId , coreVolumeId ,shopId,quantity,connection = db){
           if (isNaN(quantity)) {
            return false; 
        }
        const stock = await this.getStockQuantity(coreProductId,coreVolumeId,shopId,connection);
        return quantity <= stock;
    }

}

const unpacked = {
     async  getStock(connection = db) {
        const [result] = await connection.query('select * from un_packed_stock');
        return result;
        
    },
    async getStockQuantity( coreProductId,outputId,shopId, connection = db) {
        const [result] = await connection.query('select quantity from un_packed_stock where  cpid = ? and  opid = ? and sid = ?', [ coreProductId, outputId, shopId]);
        return result[0]?.quantity || 0;

    },
    async update(coreProductId , outputId ,shopId,quantity,connection = db){
        return await connection.query('update un_packed_stock set quantity = quantity + ?  where cpid = ? and opid = ? and sid = ?',[quantity,coreProductId,outputId,shopId])

    },
    async reduce(coreProductId , outputId ,shopId,quantity,connection = db){
        return await this.update( coreProductId, outputId, shopId, -quantity , connection);

    },
    async restore(coreProductId , outputId ,shopId,quantity,connection = db){
        return await this.update( coreProductId, outputId, shopId, +quantity , connection);

    },
    async isStockAvailable(coreProductId , outputId ,shopId,quantity,connection = db){
        const stock = await this.getStockQuantity(coreProductId,outputId,shopId,connection);
        return quantity <= stock;
    }


    
}


const production = {

    async  getStock(connection = db) {
        const [result] = await connection.query('select * from production_stock');
        return result;
        
    },
    async getStockQuantity( coreProductId, productionProductId, connection = db) {
        const [result] = await connection.query('select quantity from production_stock where  cpid = ? and  ppid = ? ', [ coreProductId, productionProductId]);
        return result[0]?.quantity || 0;

    },
    async update( coreProductId, productionProductId, quantity, connection = db){
        return await connection.query('update production_stock set quantity = quantity + ?  where cpid = ? and ppid = ? ',[ quantity , coreProductId , productionProductId ])

    },
    async reduce( coreProductId, productionProductId,quantity, connection = db){
        return await this.update( coreProductId , productionProductId , -quantity, connection);

    },
    async restore( coreProductId, productionProductId,quantity, connection = db){
        return await this.update( coreProductId, productionProductId, +quantity, connection);

    },
    async isStockAvailable( coreProductId, productionProductId,quantity, connection = db){
        const stock = await this.getStockQuantity(coreProductId, productionProductId, connection);
        return quantity <= stock;
    }

    
}


module.exports = {
    production,
    packed,
    unpacked
}