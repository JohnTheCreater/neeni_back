const db=require('.././db')


const addBottles=async(req,res)=>{
    const{sid,cpid,cvid,value}=req.body;

    let sql_query='UPDATE STACK set quantity=quantity+? where sid=? AND cpid=? AND cvid=?'

    await db.query(sql_query,[value,sid,cpid,cvid],(err,result)=>{
        if(err) throw err;
        let opid=cvid===5?2:1;
        const quan=[1.0,0.5,0.2,0.1,1]
        let val=quan[cvid-1];
        
        db.query('UPDATE total_stack set total_quantity=total_quantity-? where cpid=? AND sid=? AND opid=?',
            [value*val,cpid,sid,opid],(err,res1)=>{
                if(err) throw err;
            }
        )

        res.status(200).send("updated suc!")
    })
}

const addStack=async(req,res)=>{
    const{cpid,opid,sid,value}=req.body;
    let sql_query=`Update total_stack set total_quantity=total_quantity+? where cpid=? AND opid=? AND sid=?`

    await db.query(sql_query,[value,cpid,opid,sid],(err,result)=>{
        if(err) throw err;
        db.query('update production_stack set quantity=quantity-? where cpid=? AND ppid=?',[value,cpid,opid],(err,re1)=>{
            if(err) throw err;
        })
        res.status(200).send('updated');
    })

}
exports.addStack=addStack
exports.addBottles=addBottles