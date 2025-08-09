const authService = require('../service/authService');
const { getErrorResponse } = require('../util/util');

const login = async(req,res) => {

    const {username,password} = req.body;
    const result = await authService.authenticateUser(username,password);
    if(result.success)
    {
        res.cookie('refreshToken',result.data.refreshToken,{ 
                    httpOnly: true,           
                    secure: process.env.NODE_ENV === 'production', 
                    sameSite: 'lax',         
                    maxAge: 7 * 24 * 60 * 60 * 1000, 
                    path: '/'                
                })
        return res.status(200).json({accessToken :result.data.accessToken});
    }
    
    return getErrorResponse(res,result);
    


}

const getRefreshToken = async(req, res) => {
    try {

        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not provided'
            });
        }
        
        const result = await authService.refreshAccessToken(refreshToken);
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                accessToken: result.data.accessToken
            });
        } else {

            res.clearCookie('refreshToken');
            return res.status(result.statusCode).json({
                success: false,
                message: result.message
            });
        }
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


module.exports = {
    login,
    getRefreshToken
}