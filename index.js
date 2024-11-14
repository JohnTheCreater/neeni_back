const express=require('express')
const cors=require('cors')
const route=require('./route')

const app=express();

app.use(express.json());

app.use(cors())
app.use('/api',route)

const PORT=process.env.PORT||2024;

app.listen(PORT,()=>{
    console.log("listen at ",PORT);
})


