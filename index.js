const express=require('express')
const cors=require('cors')
const route = require('./routes/index')
require('dotenv').config();


const app = express();

app.use(express.json());


app.use(cors())

app.use(process.env.ROUTE,route)

const PORT=process.env.PORT||2024;

app.listen(PORT,()=>{
    console.log("listen at ",PORT);
})


