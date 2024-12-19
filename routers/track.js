const express = require('express');
const router = express.Router();
const Invoice = require('../models/invoice'); // Adjust the path to the Invoice model
const path = require('path');
const fs = require('fs');

router.get('/download/:invoiceId', async (req, res) => {
  const { invoiceId } = req.params;

  try {
    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    const filePath = path.resolve(invoice.invoiceFilePath); // Resolve the full path to the file
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Invoice file not found.' });
    }

    res.download(filePath, `Invoice-${invoiceId}.pdf`); // Trigger the download with a meaningful filename
  } catch (error) {
    console.error('Error fetching invoice file:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching the invoice file.' });
  }
});

module.exports = router;
