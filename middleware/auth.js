const { verifyAccessToken } = require('../modules/auth/authService');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(401).json({
            success: false,
            errorCode: 'NO_TOKEN',
            message: 'Access token required'
        });
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                errorCode: 'ACCESS_TOKEN_EXPIRED',
                message: 'Access token expired'
            });
        }
        
        return res.status(403).json({
            success: false,
            errorCode: 'INVALID_ACCESS_TOKEN',
            message: 'Invalid access token'
        });
    }
};

module.exports = {
    authenticateToken
};
