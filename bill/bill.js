const db=require('../db')
const dayjs=require('dayjs')
const {createInvoice}=require('./createInvoice')
const fs=require('fs')
const path=require('path')
const nodemailer=require('nodemailer')



const addBill = async (req, res) => {
    const { user, purchaseList, shop, date, billNumber, mode } = req.body;

    
    if (mode === "edit") {
        await db.query(`DELETE FROM bills WHERE id = ?`, [billNumber]);
        console.log("Old bill deleted",purchaseList);
        
    }
  

    const query = `INSERT INTO bills(id, userid, date, shop) VALUES (?, ?, ?, ?)`;
    const dateIST = dayjs(date).format("YYYY-MM-DD hh:mm:ss");
    const shopId = shop === 'Madurai' ? 1 : 2;

    console.log(user, purchaseList, shop, dateIST, billNumber, mode);

    await db.query(query, [billNumber, user.id, dateIST, shopId]);
    console.log("Inserted in bills",purchaseList);

    const sql_query = `INSERT INTO sales(pid, quantity, paidStatus, bill_no, price, sub_total) VALUES ?`;
    const values = purchaseList.map(element => [
        element.pid,
        element.quantity,
        element.paidStatus,
        billNumber,
        element.pprice,
        element.sub_total
    ]);

    await db.query(sql_query, [values]);
    console.log("Inserted in sales");
};



const getBillCount=async(req,res)=>{
    let sql_query=`select COUNT(id) as total_count from bills`;

    await db.query(sql_query,(err,result)=>{
        res.status(200).send(result);
    })
}



const getSales=async(req,res)=>{
    const{billNo}=req.body;

    let sql_query= `select * from sales where bill_no=?`
    await db.query(sql_query,[billNo],(err,result)=>{
        if(err) throw err;
        res.status(200).send(result);
    })
}



const downloadBill = async (req, res) => {
  try {
      const { bill } = req.body;

     const invoice=await getInvoice(bill);

      const doc = await createInvoice(invoice); // Create the invoice PDF
      const filePath = path.join(__dirname, '../', 'invoice.pdf');
      const fileStream = fs.createWriteStream(filePath);
      doc.pipe(fileStream);

      

      fileStream.on('finish', () => {
          res.download(filePath, 'invoice.pdf', (err) => {
              if (err) {
                  console.error("Error sending file to client: ", err);
                  res.status(500).send("Error downloading file");
              }
              fs.unlink(filePath, (err) => {
                  if (err) console.error("Error deleting file: ", err);
              });
          });
      });
      doc.end();
     

  } catch (err) {
      console.error("Error generating PDF: ", err);
      res.status(500).send("Error generating PDF");
  }
};

const getInvoice=async (bill)=>{

    const sales = await db.query("SELECT pid, quantity, paidStatus, price, sub_total FROM sales WHERE bill_no = ?", [bill.id]);
    const products = await db.query("SELECT id, pname FROM products");
    const user = await db.query("SELECT * FROM user where id=?",[bill.userid]);

    const total = sales.reduce((acc, item) => acc + parseInt(item.sub_total), 0);
    const paid = sales.reduce((acc, item) => item.paidStatus === "paid" ? acc + parseInt(item.sub_total) : acc, 0);

    const invoice = {
        user: {
            name: user[0]?.name,
            address: user[0]?.address,
            mobile_no: user[0]?.mobileno,
            user_gst: `gst:${user[0]?.gstnumber}`,
            email:user[0].email
        },
        items: sales.map(item => {
            const product = products.find(prod => prod.id === item.pid);
            return {
                ...item,
                item: product ? product.pname : "Unknown Product"
            };
        }),
        total,
        paid,
        invoice: bill.id,
        date: new Date(bill.date)
    };
    return invoice;

}



const sendBill = async (req, res) => {
    const { bill } = req.body;
    
      const invoice=await getInvoice(bill)

      const doc = await createInvoice(invoice);
      doc.end();
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(buffers);
  
        const sender = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "neenikafoodpower@gmail.com",
            pass: "trlm dvyk yggg zsio",
          },
        });
        await console.log(invoice.user.email)
        const composeMail = {
          from: "neenikafoodpower@gmail.com",
          to: invoice.user.email,
          subject: `The bill for purchase on ${dayjs(bill.date).format("DD-MM-YYYY")}`,
          attachments: [
            {
              filename: `Neenika_${bill.id}.pdf`,
              content: pdfBuffer,
            },
          ],
        };
  
        await sender.sendMail(composeMail, (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).send();
          } else {
            console.log("mail sent");
            res.status(200).send({ message: "mail sent successfully" });}
        });
      });
      
}




exports.downloadBill=downloadBill
exports.sendBill=sendBill
exports.getSales=getSales
exports.getBillCount=getBillCount
exports.addBill=addBill
