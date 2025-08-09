const dayjs = require("dayjs")

const getFormatedDate = (date) => {
   const formatedDate = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
   console.log(formatedDate);
    return formatedDate;
}

const getAppErrorResult = (err) => {
    return {success:false,statusCode:err.statusCode,message:err.message};
}

const getInternalErrorResult = () => {
    return {success:false,statusCode:500,message:'something went wrong'}

}

const getErrorResponse = (res,errorResult) => {
    return res.status(errorResult.statusCode).json({message:errorResult.message});
}
module.exports = {
    getFormatedDate,
    getAppErrorResult,
    getInternalErrorResult,
    getErrorResponse
}