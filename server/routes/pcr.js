const express = require('express');
const router = express.Router();
const { generateIPCRPdf } = require('../utils/generatePCR');
const { generateIPCRExcel } = require('../utils/generatePCRExcel');
const { getUserPCRs, createPCR, deletePCR } = require('../controllers/pcrController')
const protect             = require('../middleware/authMiddleware');

router.post('/generate-pdf', (req, res) => {
  try {
    const data = req.body;
    const chunks = [];

    // Buffer the PDF into memory first, then send
    const { PassThrough } = require('stream');
    const stream = new PassThrough();

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="IPCR.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
      res.end(pdfBuffer);
    });
    stream.on('error', (err) => {
      console.error('PDF stream error:', err);
      res.status(500).json({ error: 'PDF generation failed' });
    });

    generateIPCRPdf(data, stream);
  } catch (err) {
    console.error('PDF route error:', err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});


router.post('/generate-excel', async (req, res) => {
  try {
    const { PassThrough } = require('stream');
    const stream = new PassThrough();
    const chunks = [];

    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="IPCR.xlsx"');
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    });

    await generateIPCRExcel(req.body, stream);
  } catch (err) {
    console.error('Excel route error:', err);
    res.status(500).json({ error: 'Excel generation failed' });
  }
});

router.get('/',  protect, getUserPCRs)   // GET  /api/pcr
router.post('/', protect, createPCR)     // POST /api/pcr  ← this was missing
router.delete('/:id', protect, deletePCR)


module.exports = router;