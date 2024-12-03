// models/invoice.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  name: {  // The new 'name' field
    type: String,
    required: true, // You can set it as required or optional
  },
  pdfData: {
    type: Buffer, // The PDF file will be stored as binary data (Buffer)
    required: true,
  }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;