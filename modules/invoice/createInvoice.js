const PDFDocument = require("pdfkit");

function createInvoice(invoice) {
  let doc = new PDFDocument({ size: "A4", margin: 50 });

  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc);

  

  return doc;
  // doc.pipe(fs.createWriteStream(path));
}

function generateHeader(doc) {
  doc
    .image("logo.png", 50, 45, { width: 50 })
    .fillColor("#444444")
    .fontSize(20)
    .text("NEENIKAA FOOD POWER", 110, 60)
    .fontSize(10)
    .text("NeeNiKaa food power", 185, 50, { align: "right" })
    .text("No 30 school street,", 185, 65, { align: "right" })
    .text("Kuttakkarai,Kalamanagar", 185, 80, { align: "right" })
    .text("Uthiramerur(po),Kanchipuram(dt),", 185, 95, { align: "right" })
    .text("Tamilnadu-603406", 185, 110, { align: "right" })

    .moveDown();
}

function generateCustomerInformation(doc, invoice) {

  const maxWidth = 595.28; // Maximum width of an A4 page in points
const margin = 50; // Define a margin to avoid text touching the edges
const usableWidth = maxWidth - 2 * margin; 

const balanceDue=invoice.total - invoice.paid - invoice.paidAmount;
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;
  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.invoice, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(formatDate(invoice.date), 150, customerInformationTop + 15)
    .text("Balance Due:", 50, customerInformationTop + 30)
    .text(
      formatCurrency(balanceDue),
      150,
      customerInformationTop + 30
    )

    .font("Helvetica-Bold")
    .text(invoice.customer.name, 300, customerInformationTop)
    .font("Helvetica")
    const addressLines = invoice.customer.address.split('\n');
    let addressPos=customerInformationTop;
    let prevWordLength=0;
    const avgCharWidth = 6; 
    addressLines.forEach((line, index) => {
      const lineWidth = line.length * avgCharWidth;
      if (300 + prevWordLength + lineWidth > usableWidth) {
          prevWordLength = 0; 
          addressPos += 15; 
      }
      doc.text(line, 300 + prevWordLength, addressPos + 15);
      prevWordLength += lineWidth;
  });
    doc
      .text(invoice.customer?.customer_gst||`No gst!`, 300, addressPos + 30)
      .text(invoice.customer.mobile_no, 300, addressPos + 45)
      .moveDown();

  generateHr(doc, addressPos+60);
}

function generateInvoiceTable(doc, invoice) {
  const balanceDue=invoice.total - invoice.paid - invoice.paidAmount;

  let i;
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Unit Cost",
    "Quantity",
    "Line Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      item.item,
      formatCurrency(item.price),
      item.quantity,
      formatCurrency(item.sub_total)
    );

    generateHr(doc, position + 20);
  }
  const gstRate = 0.05;
  const gst = invoice.total * gstRate / (1 + gstRate);
  const cgst = gst / 2;
  const sgst = gst / 2;

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateInfoRow(
    doc,
    subtotalPosition,
    "CGST (2.5%)",
    formatCurrency(cgst),
    "Total",
    formatCurrency(invoice.total)
  );

  


  const cgstPosition = subtotalPosition + 20;
  generateInfoRow(
    doc,
    cgstPosition,
    "SGST (2.5%)",
    formatCurrency(sgst),
    "Paid To Date",
    formatCurrency(invoice.paid + invoice.paidAmount)
    
  );
  
  const sgstPosition = cgstPosition + 20;

    
  doc.font("Helvetica-Bold");

  generateInfoRow(
    doc,
    sgstPosition,
    "",
    "",
    "Balance Due",
    formatCurrency(balanceDue)
  );

  doc.font("Helvetica");
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Payment is due within 15 days. Thank you for your business.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateInfoRow(
  doc,
  y,
  title1,
  value1,
  title2,
  value2
) {
  doc
    .fontSize(10)
    .text(title1, 50, y)
    .text(value1, 140, y, { width: 90, align: "right" })
    .text(title2, 370, y, { width: 90, align: "right" })
    .text(value2, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatCurrency(rs) {
  return "Rs." + Number(rs).toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}

module.exports = {
  createInvoice
};
