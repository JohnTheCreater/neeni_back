const db = require("../db");
const dayjs = require("dayjs");
const { createInvoice } = require("./createInvoice");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const addBill = async (req, res) => {
  const { user, purchaseList, shop, date, billNumber, mode, paidAmount, bill_amount } = req.body;

  let green_flag = false;

  try {
    if (mode === "edit") {
      const oldSales = await db.query("select * from sales where bill_no=?", [billNumber]);

      // Return old stack
      for (const element of oldSales) {
        await returnToAvailStack(element, shop.id);
      }

      // Check stack availability
      if (await isStackAvailable(purchaseList, shop.id)) {
        await db.query(`DELETE FROM bills WHERE id = ?`, [billNumber]);
        // await db.query(`DELETE FROM sales WHERE bill_no = ?`, [billNumber]);
        green_flag = true;
      } else {
        // Undo the returning of old stack
        for (const element of oldSales) {
          await takeFromAvailStack(element, shop.id);
        }
        res.status(404).send("No Stack Available!");
        return;
      }
    }

    if (green_flag || (await isStackAvailable(purchaseList, shop.id))) {
      const query = `INSERT INTO bills(id, userid, date, shopid, paidAmount, bill_amount) VALUES (?, ?, ?, ?, ?, ?)`;
      const dateIST = dayjs(date).format("YYYY-MM-DD HH:mm:ss");
      const shopId = shop.id;

      await db.query(query, [billNumber, user.id, dateIST, shopId, paidAmount, bill_amount]);

      const sql_query = `INSERT INTO sales(pid, quantity, paidStatus, bill_no, price, sub_total) VALUES ?`;
      const values = purchaseList.map((element) => [
        element.pid,
        element.quantity,
        element.paidStatus,
        billNumber,
        element.price,
        element.sub_total,
      ]);

      await db.query(sql_query, [values]);

      for (const element of purchaseList) {
        await takeFromAvailStack(element, shopId);
      }

      res.status(200).send("Inserted Successfully!");
    } else {
      res.status(404).send("No Stack Available!");
    }
  } catch (err) {
    console.error("Error in addBill:", err.message);
    res.status(500).send("Internal Server Error");
  }
};

const removeBill=async(req,res)=>{
  const {billNumber,shop}=req.body
  try{
  const sales=await db.query("select * from sales where bill_no=?",[billNumber])
  for(const element of sales)
  {
    await returnToAvailStack(element,shop.id)
  }
  await db.query("delete from bills where id=?",[billNumber])
  res.status(200).send("Bill Deleted Sucessfully!");
}
catch(err){
  res.status(err.code).send("Error occurs!")
}
}
const isStackAvailable = async (purchaseList, shopId) => {
  const type1info = await db.query("select * from type1info");
  const avail_stack = await db.query("select * from avail_stack");
  for (const sale of purchaseList) {
    const product = type1info.find((item) => item.pid === sale.pid);
    if (product) {
      const stack = avail_stack.find(
        (item) =>
          item.cpid === product.cpid &&
          item.cvid === product.cvid &&
          item.sid === shopId
      );
      if (Number(stack.quantity) < Number(sale.quantity)) {
        return false;
      }
    }
  }
  return true;
};

const takeFromAvailStack = async (element, shopId) => {
  const product = await db.query("select * from products where id=?", [
    element.pid,
  ]);
  if ((await product[0]?.type) === 1) {
    const { cpid, cvid } = await getCoreIds(product[0].id);
    await db.query(
      "update avail_stack set quantity=quantity-? where cpid=? AND cvid=? AND sid=?",
      [element.quantity, cpid, cvid, shopId]
    );
 
  }
};

const returnToAvailStack = async (element, shopId) => {
  const product = await db.query("select * from products where id=?", [
    element.pid,
  ]);

  if ((await product[0]?.type) === 1) {
    const { cpid, cvid } = await getCoreIds(product[0].id);
    await db.query(
      "update avail_stack set quantity=quantity+? where cpid=? AND cvid=? AND sid=?",
      [element.quantity, cpid, cvid, shopId]
    );
  }
};

const getCoreIds = async (pid) => {
  const type1info = await db.query("select * from type1info where pid=?", [
    pid,
  ]);
  const cpid = await type1info[0].cpid;
  const cvid = await type1info[0].cvid;
  return { cpid, cvid };
};

const getBillCount = async (req, res) => {
  let sql_query = `select COUNT(id) as total_count from bills`;

  await db.query(sql_query, (err, result) => {
    res.status(200).send(result);
  });
};

const getSales = async (req, res) => {
  const { billNo } = req.body;

  let sql_query = `select * from sales where bill_no=?`;
  await db.query(sql_query, [billNo], (err, result) => {
    if (err) throw err;
    res.status(200).send(result);
  });
};

const downloadBill = async (req, res) => {
  try {
    const { bill } = req.body;

    const invoice = await getInvoice(bill);

    const doc = await createInvoice(invoice); // Create the invoice PDF
    const filePath = path.join(__dirname, "../", "invoice.pdf");
    const fileStream = fs.createWriteStream(filePath);
    doc.pipe(fileStream);

    fileStream.on("finish", () => {
      res.download(filePath, "invoice.pdf", (err) => {
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

const getInvoice = async (bill) => {
  const sales = await db.query(
    "SELECT pid, quantity, paidStatus, price, sub_total FROM sales WHERE bill_no = ?",
    [bill.id]
  );
  const products = await db.query("SELECT id, name FROM products");
  const user = await db.query("SELECT * FROM user where id=?", [bill.userid]);

  const total = sales.reduce((acc, item) => acc + parseInt(item.sub_total), 0);
  const paid = sales.reduce(
    (acc, item) =>
      item.paidStatus === "paid" ? acc + parseInt(item.sub_total) : acc,
    0
  );

  const invoice = {
    user: {
      name: user[0]?.name,
      address: user[0]?.address,
      mobile_no: user[0]?.mobileno,
      user_gst: `gst:${user[0]?.gstnumber}`,
      email: user[0].email,
    },
    items: sales.map((item) => {
      const product = products.find((prod) => prod.id === item.pid);
      return {
        ...item,
        item: product ? product.name : "Unknown Product",
      };
    }),
    total,
    paid,
    invoice: bill.id,
    date: new Date(bill.date),
    paidAmount:  Number(bill.paidAmount)
  };
  return invoice;
};

const sendBill = async (req, res) => {
  const { bill } = req.body;

  const invoice = await getInvoice(bill);

  const doc = await createInvoice(invoice);
  doc.end();
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", async () => {
    const pdfBuffer = Buffer.concat(buffers);

    const sender = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_GMAIL,
        pass: process.env.ADMIN_GMAIL_PASSKEY,
      },
    });

    const composeMail = {
      from: process.env.ADMIN_GMAIL,
      to: invoice.user.email,
      subject: `The bill for purchase on ${dayjs(bill.date).format(
        "DD-MM-YYYY"
      )}`,
      attachments: [
        {
          filename: `Neenika_${bill.id}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    await sender.sendMail(composeMail, (err, result) => {
      if (err) {
        res.status(500).send();
      } else {
        console.log("mail sent");
        res.status(200).send({ message: "mail sent successfully" });
      }
    });
  });
};

const getLastBillNumber = async (req, res) => {
  let sql_query = `select id from bills ORDER BY id DESC LIMIT 1`;

  await db.query(sql_query, (err, result) => {
    if (err) throw err;
    res.status(200).send(result);
  });
};


const sendNotification = async (req, res) => {
  const { billNumber } = req.body;
  console.log(billNumber)
  try {

  let sql_query = `select pid,quantity,paidStatus,price,sub_total from sales where bill_no=?`;
  const salesList= await db.query(sql_query, [billNumber]);
  const productList= await db.query("select * from products");
  const bill= await db.query("select * from bills where id=?",[billNumber]);
  const customer =await db.query("select * from user where id=?",[bill[0].userid])
  const sender = await nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ADMIN_GMAIL,
      pass: process.env.ADMIN_GMAIL_PASSKEY,
    },
  });
  const composeMail = {
    from: process.env.ADMIN_GMAIL,
    to: customer[0].email,
    subject: "Notification Of Your Purchase!",
    html: `<div>
    <div>
  <h2>Dear ${customer[0].name},</h2>
  <p>Thank you for purchasing!. Kindly pay the bill for unpaid products.</p>
  <h4>Date: ${dayjs(bill[0].date).format("DD-MM-YYYY")}</h4>
</div>
    <table style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product name</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Quantity</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Price</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Sub Total</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Paid Status</th>
        </tr>
      </thead>
      <tbody>
      ${salesList
        .map((item) => {
          const product=productList.find((prod)=>prod.id==item.pid)
          return `
            <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${
              product.name
            }</td>
        
            <td style="border: 1px solid #ddd; padding: 8px;">${
              item.quantity
            }</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${
              item.price
            }</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${
              item.sub_total
            }</td>
           
          
              <td bgcolor=${item.paidStatus==="paid"?"green":"red"} style="border: 1px solid #ddd; padding: 8px;">${
              item.paidStatus
            }</td>
          </tr>`;
        })
        .join("")}
        
      </tbody>
    </table>
    </div>
  `,
  };

  await sender.sendMail(composeMail, (err, info) => {
    if (err) {
      console.log(err.message);
      return;
    }
    console.log("mail sended");
    console.log(info.messageId);
  });
  res.status(200).send("notified!");
}
catch(err){
  console.log(err)
  res.status(500).send("An Error Ouccured At The BackEnd!")
}

  
 
};

const getPaymentInfo = async(req,res)=>{

  const {dateISO}=req.body
  const date = new Date(dateISO);
    const startDate = new Date(date.getFullYear(),date.getMonth(),1);
    const endDate = new Date(date.getFullYear(),date.getMonth()+1,0,23, 59, 59, 999);
     

    try{
      const query=`SELECT SUM(paidAmount) as paidAmount FROM bills WHERE date BETWEEN ? AND ?`
    const paidAmountResult = await db.query(query,[startDate,endDate]);
    const paidAmount = paidAmountResult[0].paidAmount || 0;
    const paidQuery = `select sum(sales.sub_total) as total from sales inner join bills where sales.bill_no=bills.id AND date BETWEEN ? AND ? AND paidStatus=?`
    const totalPaidResult = await db.query(paidQuery,[startDate,endDate,"paid"]);
    const totalPaid = totalPaidResult[0].total || 0;
    const totalRecived = parseFloat(paidAmount)+parseFloat(totalPaid);
    const totalBillQuery  = `select sum(sales.sub_total) as total from sales inner join bills where sales.bill_no=bills.id AND date BETWEEN ? AND ?`
    const totalBillAmountResult = await db.query(totalBillQuery,[startDate,endDate]);
    const totalRemainingPayment = totalBillAmountResult[0].total- totalRecived;

      console.log("paid:",parseFloat(totalRecived),"unpaid:",totalRemainingPayment)
    res.status(200).send({paid:parseFloat(totalRecived).toFixed(2),unpaid:parseFloat(totalRemainingPayment).toFixed(2)});
    

    }
    catch(err)
    {
      console.log(err);
      res.status(500).send(err.message);
    }



}


exports.getPaymentInfo = getPaymentInfo
exports.getLastBillNumber = getLastBillNumber;
exports.sendNotification=sendNotification;
exports.downloadBill = downloadBill;
exports.sendBill = sendBill;
exports.getSales = getSales;
exports.getBillCount = getBillCount;
exports.addBill = addBill;
exports.removeBill=removeBill;
