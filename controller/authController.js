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
                });
         res.cookie('accessToken',result.data.accessToken,{ 
                    httpOnly: true,           
                    secure: process.env.NODE_ENV === 'production', 
                    sameSite: 'lax',         
                    maxAge: 15 * 60 * 1000,
                    path: '/'                
                });

        return res.status(200).json({
            success: true,
            message: 'Login successful'
        });
    }
    
    return getErrorResponse(res,result);
}

const refresh = async(req, res) => {

        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token not provided',
                errorCode: 'REFRESH_TOKEN_MISSING'
            });
        }
        
        const result = await authService.refreshAccessToken(refreshToken);
        
        if (result.success) {
            res.cookie('accessToken',result.accessToken,{
                httpOnly:true,
                secure:process.env.NODE_ENV === 'production',
                sameSite:'lax',
                maxAge: 15 * 60 * 1000,
                path:'/'
            });
            return res.status(200).json({
                success: true,
                message: 'Token refreshed successfully'
            });
        } else {
            res.clearCookie('refreshToken');
            res.clearCookie('accessToken');
            return getErrorResponse(res, result);
        }
    
};

const logout = async (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    return res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
};


module.exports = {
    login,
    refresh,
    logout
}