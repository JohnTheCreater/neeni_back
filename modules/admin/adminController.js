const authSevice = require('../auth/authService');
const { getErrorResponse } = require('../util/util');

const updateCredentials = async (req,res) => {


    const {password} = req.body;

    const result = await authSevice.changePassword(req.user.username,password);
    if(result.success)
    {
        return res.status(200).json({message:'admin credentials updated!'});

    }
    
    return  getErrorResponse(res,result);
    

}

module.exports = {
    updateCredentials
}