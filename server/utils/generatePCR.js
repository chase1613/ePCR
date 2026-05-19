const PDFDocument = require('pdfkit');
const path        = require('path');

const LOGO_PATH = path.join(__dirname, '../assets/csc-final.png');

function generateIPCRPdf(data, outputStream) {
  const doc = new PDFDocument({
    size: 'LETTER',
    layout: 'landscape',
    margins: { top: 36, bottom: 36, left: 36, right: 36 },
    bufferPages: true,
  });

  doc.pipe(outputStream);

  const PAGE_W = doc.page.width;
  const LEFT   = 36;
  const RIGHT  = 36;
  const PW     = PAGE_W - LEFT - RIGHT; // ~540

  // ─── Colors ───────────────────────────────────────────────
  const CORE_BG   = '#D9E1F2';
  const STRAT_BG  = '#FCE4D6';
  const SUPP_BG   = '#E2EFDA';
  const SUBTOT_BG = '#BDD7EE';
  const RATING_BG = '#D6E4F7';

  // ─── Column widths (total = PW) ───────────────────────────
  const C = {
    mfo: PW * 0.23,
    si:  PW * 0.26,
    acc: PW * 0.13,
    q:   PW * 0.075,
    e:   PW * 0.075,
    t:   PW * 0.075,
    a:   PW * 0.075,
    rem: PW * 0.11,
  };
  C.mfoX = LEFT;
  C.siX  = C.mfoX + C.mfo;
  C.accX = C.siX  + C.si;
  C.qX   = C.accX + C.acc;
  C.eX   = C.qX   + C.q;
  C.tX   = C.eX   + C.e;
  C.aX   = C.tX   + C.t;
  C.remX = C.aX   + C.a;

  // ─── Helpers ──────────────────────────────────────────────
  function drawRect(x, y, w, h, fill, stroke) {
    doc.save();
    doc.rect(x, y, w, h);
    if (fill && stroke) { doc.fillColor(fill).strokeColor(stroke).fillAndStroke(); }
    else if (fill)      { doc.fillColor(fill).fill(); }
    else if (stroke)    { doc.strokeColor(stroke).stroke(); }
    doc.restore();
  }

  function drawCell(text, x, y, w, h, opts = {}) {
    const {
      fontSize = 7,
      bold     = false,
      align    = 'left',
      fill     = null,
      stroke   = '#000000',
      color    = '#000000',
      valign   = 'center',
      paddingX = 3,
      paddingY = 3,
    } = opts;

    drawRect(x, y, w, h, fill, stroke);

    const txt = String(text || '');
    if (!txt) return;

    doc.save();
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(fontSize)
       .fillColor(color);

    const textW = w - paddingX * 2;
    const textH = doc.heightOfString(txt, { width: textW });
    let   textY = y + paddingY;
    if (valign === 'center') textY = y + Math.max(paddingY, (h - textH) / 2);

    doc.text(txt, x + paddingX, textY, {
      width:     textW,
      height:    h - paddingY * 2,
      align,
      lineBreak: true,
    });
    doc.restore();
  }

  let curY = doc.page.margins.top;

  function checkNewPage(neededHeight) {
    if (curY + neededHeight > doc.page.height - 40) {
      doc.addPage();
      curY = doc.page.margins.top;
    }
  }

  // ─── HEADER ───────────────────────────────────────────────
  const { employee = {}, period = 'January – June, 2026' } = data;
  const empName  = employee.name          || 'EMPLOYEE NAME';
  const empPos   = employee.position      || 'POSITION';
  const empDiv   = employee.division      || 'Division';
  const dirName  = employee.director      || 'Atty. ERNA T. ELIZAN';
  const dirTitle = employee.directorTitle || 'Director IV';
  const empDate  = employee.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Logo on left, header text centered on remaining width
  const LOGO_W  = 70;
  const LOGO_H  = 60;
  const headerStartY = curY;

  // Draw logo (safe try/catch in case file missing)
  try {
    doc.image(LOGO_PATH, LEFT, headerStartY, { width: LOGO_W, height: LOGO_H, fit: [LOGO_W, LOGO_H] });
  } catch (e) {
    console.warn('Logo not found at', LOGO_PATH, '— skipping');
  }

  // Center the header text in the remaining space to the right of the logo
  const textX = LEFT + LOGO_W + 8;
  const textW = PW - LOGO_W - 8;

  doc.font('Helvetica').fontSize(8).fillColor('#000')
     .text('Republic of the Philippines', textX, curY, { width: textW, align: 'center' });
  curY += 11;

  doc.font('Helvetica-Bold').fontSize(13)
     .text('CIVIL SERVICE COMMISSION', textX, curY, { width: textW, align: 'center' });
  curY += 16;

  doc.font('Helvetica').fontSize(9)
     .text('Regional Office VI', textX, curY, { width: textW, align: 'center' });
  curY += 11;

  doc.text('Mandurriao, Iloilo City', textX, curY, { width: textW, align: 'center' });
  curY += 16;

  // Make sure curY clears the logo height
  curY = Math.max(curY, headerStartY + LOGO_H + 4);

  doc.font('Helvetica-Bold').fontSize(9)
     .text('INDIVIDUAL PERFORMANCE COMMITMENT & REVIEW', LEFT, curY, { width: PW, align: 'center' });
  curY += 16;

  const stmt = `I, ${empName}, ${empPos} of ${empDiv}, commits to deliver and agree to be rated on the attainment of the following targets in accordance with the indicated measures for the period of ${period}.`;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#000')
     .text(stmt, LEFT, curY, { width: PW });
  curY = doc.y + 10;

  doc.font('Helvetica-Bold').fontSize(8)
     .text(empName, LEFT, curY, { width: PW, align: 'right' });
  curY += 11;
  doc.font('Helvetica').fontSize(7.5)
     .text(empPos, LEFT, curY, { width: PW, align: 'right' });
  curY += 14;

  doc.font('Helvetica').fontSize(7.5).text('Reviewed by:', LEFT, curY);
  doc.text(`Date: ${empDate}`, LEFT, curY, { width: PW, align: 'right' });
  curY += 16;

  const halfW = PW * 0.45;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#C00000')
     .text('Division Chief/Field Officer', LEFT, curY, { width: halfW, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#000')
     .text(dirName, LEFT + PW * 0.5, curY, { width: halfW, align: 'center' });
  curY += 11;

  doc.font('Helvetica').fontSize(7).fillColor('#000')
     .text('Position', LEFT, curY, { width: halfW, align: 'center' });
  doc.font('Helvetica').fontSize(7)
     .text(dirTitle, LEFT + PW * 0.5, curY, { width: halfW, align: 'center' });
  curY += 20;

  // ─── Draw function section ────────────────────────────────
  const ROW_H  = 40;
  const HEAD_H = 28;
  const SECT_H = 16;
  const SUB_H  = 16;

  function drawSection(sectionTitle, bgColor, rows, subtotalLabel) {
    checkNewPage(SECT_H + HEAD_H + rows.length * ROW_H + SUB_H + 10);

    // Section title bar
    drawRect(LEFT, curY, PW, SECT_H, bgColor, '#000');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#000')
       .text(sectionTitle, LEFT + 5, curY + 4, { width: PW - 10 });
    curY += SECT_H;

    // SPMS Rating System spanning header (top half of HEAD_H)
    const ratingSpanW = C.q + C.e + C.t + C.a;

    // Draw non-rating headers spanning full HEAD_H
    drawCell('MAJOR FINAL OUTPUTS',                       C.mfoX, curY, C.mfo, HEAD_H, { bold: true, align: 'center', fontSize: 7, stroke: '#000' });
    drawCell('SUCCESS INDICATORS\n(TARGETS + MEASURES)',  C.siX,  curY, C.si,  HEAD_H, { bold: true, align: 'center', fontSize: 7, stroke: '#000' });
    drawCell('Accomplishments',                           C.accX, curY, C.acc, HEAD_H, { bold: true, align: 'center', fontSize: 7, stroke: '#000' });
    drawCell('Remarks',                                   C.remX, curY, C.rem, HEAD_H, { bold: true, align: 'center', fontSize: 7, stroke: '#000' });

    // SPMS label - top half
    drawRect(C.qX, curY, ratingSpanW, HEAD_H / 2, null, '#000');
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#000')
       .text('SPMS Rating System', C.qX + 2, curY + 4, { width: ratingSpanW - 4, align: 'center' });

    // Q E T A - bottom half
    const halfHeadY = curY + HEAD_H / 2;
    for (const [lbl, x, w] of [
      ['Q', C.qX, C.q], ['E', C.eX, C.e], ['T', C.tX, C.t], ['A', C.aX, C.a],
    ]) {
      drawCell(lbl, x, halfHeadY, w, HEAD_H / 2, { bold: true, align: 'center', fontSize: 7, stroke: '#000' });
    }
    curY += HEAD_H;

    // Data rows
    for (const row of rows) {
      checkNewPage(ROW_H);
      drawCell(row.mfo || '', C.mfoX, curY, C.mfo, ROW_H, { fontSize: 7.5, stroke: '#000' });
      drawCell(row.si  || '', C.siX,  curY, C.si,  ROW_H, { fontSize: 7.5, stroke: '#000' });
      drawCell(row.acc || '', C.accX, curY, C.acc, ROW_H, { fontSize: 7.5, stroke: '#000' });
      drawCell('', C.qX,   curY, C.q,   ROW_H, { fill: RATING_BG, stroke: '#000' });
      drawCell('', C.eX,   curY, C.e,   ROW_H, { fill: RATING_BG, stroke: '#000' });
      drawCell('', C.tX,   curY, C.t,   ROW_H, { fill: RATING_BG, stroke: '#000' });
      drawCell('', C.aX,   curY, C.a,   ROW_H, { fill: RATING_BG, stroke: '#000' });
      drawCell(row.rem || '', C.remX, curY, C.rem, ROW_H, { fontSize: 7.5, stroke: '#000' });
      curY += ROW_H;
    }

    // Subtotal row structure (from image):
    // [bgColor: "Sub Total" label | white Q+E+T: "Average" | white A: avg value | bgColor Remarks: empty]
    checkNewPage(SUB_H + 8);
    const labelW = C.mfo + C.si + C.acc;           // MFO+SI+Acc = Sub Total label
    const avgW   = C.q + C.e + C.t;                // Q+E+T = "Average" text
    const valW   = C.a;                             // A column = numeric average
    const remW   = C.rem;                           // Remarks = section color empty

    drawRect(LEFT,                        curY, labelW, SUB_H, bgColor, '#000');
    drawRect(LEFT + labelW,               curY, avgW,   SUB_H, bgColor, '#000');
    drawRect(LEFT + labelW + avgW,        curY, valW,   SUB_H, bgColor, '#000');
    drawRect(LEFT + labelW + avgW + valW, curY, remW,   SUB_H, bgColor, '#000');

    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000')
       .text(`${subtotalLabel} Sub Total`, LEFT + 5, curY + (SUB_H - 9) / 2, {
          width: labelW - 10, align: 'right',
       });
    doc.font('Helvetica').fontSize(7.5)
       .text('Average', LEFT + labelW + 2, curY + (SUB_H - 9) / 2, {
          width: avgW - 4, align: 'center',
       });
    curY += SUB_H + 10;
  }

  // ─── Render sections ──────────────────────────────────────
  const coreRows  = data.core      || [];
  const stratRows = data.strategic || [];
  const suppRows  = data.support   || [];
  const hasStrat  = stratRows.length > 0;

  drawSection(
    hasStrat ? 'CORE FUNCTION (60%)' : 'CORE FUNCTION (60%) : IF NO STRATEGIC FUNCTION (80%)',
    CORE_BG, coreRows, 'Core Function'
  );
  drawSection(
    hasStrat ? 'STRATEGIC OBJECTIVE(20%)' : 'STRATEGIC OBJECTIVE(20%) : IF WITHOUT STRATEGIC OBJECTIVE/S (0%)',
    STRAT_BG, stratRows, 'Strategic Function'
  );
  drawSection('SUPPORT FUNCTION (20%)', SUPP_BG, suppRows, 'Support Function');

  // ─── SUMMARY ──────────────────────────────────────────────
  checkNewPage(180);

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000')
     .text('SUMMARY', LEFT, curY);
  curY += 13;

  const SC = {
    cat: PW * 0.27, wt: PW * 0.26, tot: PW * 0.14, avg: PW * 0.17, wavg: PW * 0.16,
  };
  SC.catX  = LEFT;
  SC.wtX   = SC.catX  + SC.cat;
  SC.totX  = SC.wtX   + SC.wt;
  SC.avgX  = SC.totX  + SC.tot;
  SC.wavgX = SC.avgX  + SC.avg;

  const SH = 14;

  for (const [lbl, x, w] of [
    ['CATEGORY', SC.catX, SC.cat], ['WEIGHT', SC.wtX, SC.wt],
    ['TOTAL', SC.totX, SC.tot], ['AVERAGE', SC.avgX, SC.avg],
    ['WEIGHTED AVERAGE', SC.wavgX, SC.wavg],
  ]) {
    drawCell(lbl, x, curY, w, SH, { bold: true, align: 'center', fontSize: 7, fill: '#E9EFF7', stroke: '#000' });
  }
  curY += SH;

  const sumRows = [
    ['CORE FUNCTION',              hasStrat ? '80% / 60% (If with Strategic Function)' : '80%'],
    ['STRATEGIC FUNCTION',         hasStrat ? '20% / 0% (If without Strategic Objective)' : '20%'],
    ['SUPPORT FUNCTION',           '20%'],
    ['TOTAL/FINAL OVERALL RATING', ''],
    ['ADJECTIVAL RATING',          ''],
  ];

  for (const [cat, wt] of sumRows) {
    drawCell(cat, SC.catX, curY, SC.cat, SH, { fontSize: 7, bold: cat.startsWith('TOTAL') || cat.startsWith('ADJECTIVAL'), stroke: '#000' });
    drawCell(wt,  SC.wtX,  curY, SC.wt,  SH, { fontSize: 7, stroke: '#000' });
    drawCell('',  SC.totX, curY, SC.tot, SH, { stroke: '#000' });
    drawCell('',  SC.avgX, curY, SC.avg, SH, { stroke: '#000' });
    drawCell('',  SC.wavgX,curY, SC.wavg,SH, { stroke: '#000' });
    curY += SH;
  }

  curY += 8;
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000')
     .text('COMMENTS & RECOMMENDATIONS FOR DEVELOPMENT PURPOSES:', LEFT, curY);
  curY += 12;
  drawRect(LEFT, curY, PW, 36, null, '#000');
  curY += 44;

  // ─── SIGNATURE BLOCK ─────────────────────────────────────
  checkNewPage(90);

  const sigH = 72;
  const SIG  = [
    { label: 'Discussed with',   w: PW * 0.22 },
    { label: 'Date:',            w: PW * 0.12 },
    { label: 'Assessed by:\nI hereby certify that I discussed my\nassessment of the performance with\nthe employee', w: PW * 0.28 },
    { label: 'Date:',            w: PW * 0.12 },
    { label: 'Final Rating',     w: PW * 0.13 },
    { label: 'Date',             w: PW * 0.13 },
  ];

  let sx = LEFT;
  for (const col of SIG) {
    drawCell(col.label, sx, curY, col.w, sigH, {
      fontSize: 6.5, align: 'center', stroke: '#000', valign: 'top', paddingY: 5,
    });
    sx += col.w;
  }

  // Names at bottom of signature cells
  const nameY = curY + sigH - 26;

  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000')
     .text(empName, LEFT + 2, nameY, { width: SIG[0].w - 4, align: 'center' });
  doc.font('Helvetica').fontSize(7)
     .text(empPos, LEFT + 2, nameY + 11, { width: SIG[0].w - 4, align: 'center' });

  const assessX = LEFT + SIG[0].w + SIG[1].w;
  doc.font('Helvetica-Bold').fontSize(7.5)
     .text('Division Chief/Field Officer', assessX + 2, nameY, { width: SIG[2].w - 4, align: 'center' });
  doc.font('Helvetica').fontSize(7)
     .text('Position', assessX + 2, nameY + 11, { width: SIG[2].w - 4, align: 'center' });

  const finalX = assessX + SIG[2].w + SIG[3].w + SIG[4].w;
  doc.font('Helvetica-Bold').fontSize(7.5)
     .text(dirName, finalX + 2, nameY, { width: SIG[5].w - 4, align: 'center' });
  doc.font('Helvetica').fontSize(7)
     .text(dirTitle, finalX + 2, nameY + 11, { width: SIG[5].w - 4, align: 'center' });

  doc.end();
}

module.exports = { generateIPCRPdf };