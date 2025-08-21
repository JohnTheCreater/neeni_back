const express=require('express')
const cors=require('cors')
const cookieParser = require('cookie-parser');
const route = require('./routes/index')
const backupCron = require('./cron_jobs/backup_cron');
const stockCron = require('./cron_jobs/stock_cron');
require('dotenv').config();


const app = express();

app.use(cookieParser());
app.use(express.json());
backupCron.backup();
stockCron.watchStock();



app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
}))

app.use(process.env.ROUTE,route)

const PORT=process.env.PORT||2024;

app.listen(PORT,()=>{
    console.log("listen at ",PORT);
})


