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
    .text("NEENIKA FOOD POWER", 110, 60)
    .fontSize(10)
    .text("NNK food power", 185, 50, { align: "right" })
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

  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;
console.log(invoice.user?.address)
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
      formatCurrency(invoice.total - invoice.paid),
      150,
      customerInformationTop + 30
    )

    .font("Helvetica-Bold")
    .text(invoice.user.name, 300, customerInformationTop)
    .font("Helvetica")
    const addressLines = invoice.user.address.split('\n');
    let addressPos=customerInformationTop;
    let prevWordLength=0;
    const avgCharWidth = 6; 
    addressLines.forEach((line, index) => {
      const lineWidth = line.length * avgCharWidth;
      if (300 + prevWordLength + lineWidth > usableWidth) {
          prevWordLength = 0; // Reset to start a new line if it exceeds the usable width
          addressPos += 15; // Move to the next line position
      }
      doc.text(line, 300 + prevWordLength, addressPos + 15);
      prevWordLength += lineWidth;
  });
    doc
      .text(invoice.user?.user_gst||`No gst!`, 300, addressPos + 30)
      .text(invoice.user.mobile_no, 300, addressPos + 45)
      .moveDown();

  generateHr(doc, addressPos+60);
}

function generateInvoiceTable(doc, invoice) {
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
  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "Total",
    "",
    formatCurrency(invoice.total)
  );

  const gstRate = 0.05;
  const gst = invoice.total * gstRate / (1 + gstRate);
  const cgst = gst / 2;
  const sgst = gst / 2;


  const cgstPosition = subtotalPosition+20;
  generateTableRow(
    doc,
    cgstPosition,
    "",
    "CGST (2.5%)",
    "",
    formatCurrency(cgst)
  );
  
  const sgstPosition = cgstPosition + 20;
  generateTableRow(
    doc,
    sgstPosition,
    "",
    "SGST (2.5%)",
    "",
    formatCurrency(sgst));

  const paidToDatePosition = sgstPosition + 20;
  generateTableRow(
    doc,
    paidToDatePosition,
    "",
    "Paid To Date",
    "",
    formatCurrency(invoice.paid)
  );

  const duePosition = paidToDatePosition + 25;
  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    duePosition,
    "",
    "Balance Due",
    "",
    formatCurrency(invoice.total - invoice.paid)
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
