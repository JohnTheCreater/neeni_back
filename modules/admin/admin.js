const db = require('../../db');
const {getFormatedDate} = require('../util/util');


const getAdminByUsername = async (username, connection = db) => {
    const [result] = await connection.query(
        "select id, username, password, refresh_token from admin where username = ?", 
        [username]
    );
    
    return result[0];
};



const updateAdminCredentials = async (username, hashedPassword, connection = db) => {
    const updateQuery = `UPDATE admin SET password = ?, updated_at = ? WHERE username = ?`;
    return await connection.query(updateQuery, [
        hashedPassword, 
    getFormatedDate (new Date()), 
        username
    ] );
};







const updateRefreshToken = async (username, refreshToken, connection = db) => {
    const query = `UPDATE admin SET refresh_token = ?,last_login_at = ? WHERE username = ?`;
    return await connection.query(query, [
        refreshToken, 
        getFormatedDate(new Date()), 
        username
    ]);
};

module.exports = {
    getAdminByUsername,
    updateAdminCredentials,
    updateRefreshToken
};



