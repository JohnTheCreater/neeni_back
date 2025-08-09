const adminModel = require('../model/admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AppError = require('../error/appError');
const { getAppErrorResult, getInternalErrorResult } = require('../util/util');

const authenticateUser = async (username, password) => {
    try {
        const admin = await adminModel.getAdminByUsername(username);
        
        if (!admin) {
            throw new AppError('Invalid Username or Password!','INVALID_AUTH',400);
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        
        if (!isMatch) {
            throw new AppError('Invalid Username or Password!','INVALID_AUTH',400);
        }

        const accessToken = generateAccessToken(admin.id, admin.username);
        const refreshToken = generateRefreshToken(admin.id, admin.username);

        await adminModel.updateRefreshToken(username, refreshToken);
        await adminModel.updateLoginInfo(username);

        return {
            success: true,
            data: { accessToken, refreshToken }
        };

    } catch (err) {
        console.error('Authentication error:', err);
        if(err instanceof AppError) return getAppErrorResult(err);
        return  getInternalErrorResult();
    }
};

const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET_KEY);
        
        const admin = await adminModel.getAdminByRefreshToken(refreshToken);
        
        if (!admin) {
           throw new AppError('No account found for this token!','INVALID_TOKEN',404);
        }

        const newAccessToken =  generateAccessToken(admin.id, admin.username);
        
        const newRefreshToken = generateRefreshToken(admin.id, admin.username);
        await adminModel.updateRefreshToken(admin.username, newRefreshToken);

        return {
            success: true,
            data: { 
                accessToken: newAccessToken,
                newRefreshToken: newRefreshToken 
            }
        };

    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return { success: false,statusCode:404, message: 'Invalid or expired refresh token' };
        }
        if(err instanceof AppError)
                return  getAppErrorResult(err);
        console.error('Refresh token error:', err);
        return  getInternalErrorResult();
    }
};


const invalidateRefreshToken = async (username) => {
    try {
        
        await adminModel.updateRefreshToken(username,'');
        return { success: true };
    } catch (error) {
        console.error('Token invalidation error:', error);
        return { success: false, message: 'Error invalidating token' };
    }
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY);
    } catch (error) {
        throw error;
    }
};

const changePassword = async (username, newPassword) => {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await adminModel.updateAdminCredentials(username, hashedPassword);
        
        await adminModel.removeAllRefreshTokensForUser(username);
        
        return { success: true, message: 'Password Changed!' };
    } catch (error) {
        console.error('Password change error:', error);
        return { success: false, message: 'Update Failed' };
    }
};

const generateAccessToken = (id, username) => {
    return jwt.sign({id, username}, process.env.JWT_ACCESS_SECRET_KEY, {
        expiresIn: '15m' 
    });
};

const generateRefreshToken = (id, username) => {
    return jwt.sign({id, username}, process.env.JWT_REFRESH_SECRET_KEY, {
        expiresIn: '7d' 
    });
};

module.exports = {
    authenticateUser,
    changePassword,
    refreshAccessToken,        
    invalidateRefreshToken,    
    verifyAccessToken         
};