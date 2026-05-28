const ExcelJS = require('exceljs');
const path    = require('path');
const fs      = require('fs');

const LOGO_PATH = path.join(__dirname, '../assets/csc-final.png');

async function generateIPCRExcel(data, outputStream) {
  const workbook  = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('IPCR', {
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1 },
  });

  const { employee = {}, period = 'January – June, 2026' } = data;
  const empName  = employee.name          || 'EMPLOYEE NAME';
  const empPos   = employee.position      || 'POSITION';
  const empDiv   = employee.division      || 'Division';
  const dirName  = employee.director      || 'Atty. ERNA T. ELIZAN';
  const dirTitle = employee.directorTitle || 'Director IV';
  const empDate  = employee.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const coreRows  = data.core      || [];
  const stratRows = data.strategic || [];
  const suppRows  = data.support   || [];
  const hasStrat  = stratRows.length > 0;

  // ─── Column layout (A-J) ──────────────────────────────────
  worksheet.columns = [
  { width: 22 },   // A — Discussed with / MFO
  { width: 25 },   // B — Date / SI
  { width: 22 },   // C — Acc / Assessed by
  { width: 10 },   // D — Q / Date
  { width: 10 },   // E — E / (buffer)
  { width: 10 },   // F — T / Final Rating  ← widened
  { width: 10 },   // G — A / (buffer)
  { width: 22 },   // H — Remarks / Date
];

  // ─── Colors ───────────────────────────────────────────────
  const CORE_BG   = 'D9E1F2';
  const STRAT_BG  = 'FCE4D6';
  const SUPP_BG   = 'E2EFDA';
  const RATING_BG = 'D6E4F7';
  const WHITE     = 'FFFFFF';

  // ─── Helpers ──────────────────────────────────────────────
  const thinBorder = { style: 'thin', color: { argb: 'FF000000' } };
  const allThin    = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

  function solidFill(argb) {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + argb } };
  }

  function setCell(row, col, value, opts = {}) {
    const cell = worksheet.getRow(row).getCell(col);
    if (value !== null && value !== undefined) cell.value = value;
    if (opts.bold !== undefined || opts.size || opts.color) {
      cell.font = {
        bold:  opts.bold  || false,
        size:  opts.size  || 9,
        color: opts.color ? { argb: opts.color } : { argb: 'FF000000' },
      };
    }
    if (opts.fill)   cell.fill   = solidFill(opts.fill);
    if (opts.border) cell.border = allThin;
    if (opts.align || opts.valign || opts.wrap !== undefined) {
      cell.alignment = {
        horizontal: opts.align  || 'left',
        vertical:   opts.valign || 'middle',
        wrapText:   opts.wrap !== undefined ? opts.wrap : true,
      };
    }
    return cell;
  }

  function mergeAndSet(r1, c1, r2, c2, value, opts = {}) {
    if (r1 !== r2 || c1 !== c2) {
      try { worksheet.mergeCells(r1, c1, r2, c2); } catch (_) {}
    }
    return setCell(r1, c1, value, opts);
  }

  function rowHeight(r, h) { worksheet.getRow(r).height = h; }

  // ─── Logo ─────────────────────────────────────────────────
  let rowNum = 1;

  if (fs.existsSync(LOGO_PATH)) {
    const logoId = workbook.addImage({ filename: LOGO_PATH, extension: 'png' });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 80, height: 75 },
      editAs: 'oneCell',
    });
  }

  // ─── Header rows ──────────────────────────────────────────
  mergeAndSet(rowNum, 2, rowNum, 8, 'Republic of the Philippines',
    { align: 'center', valign: 'middle', size: 10 });
  rowHeight(rowNum, 15); rowNum++;

  mergeAndSet(rowNum, 2, rowNum, 8, 'CIVIL SERVICE COMMISSION',
    { align: 'center', valign: 'middle', bold: true, size: 16 });
  rowHeight(rowNum, 22); rowNum++;

  mergeAndSet(rowNum, 2, rowNum, 8, 'Regional Office VI',
    { align: 'center', valign: 'middle', size: 11 });
  rowHeight(rowNum, 15); rowNum++;

  mergeAndSet(rowNum, 2, rowNum, 8, 'Mandurriao, Iloilo City',
    { align: 'center', valign: 'middle', size: 11 });
  rowHeight(rowNum, 15); rowNum++;

  mergeAndSet(rowNum, 1, rowNum, 8, 'INDIVIDUAL PERFORMANCE COMMITMENT & REVIEW',
    { align: 'center', valign: 'middle', bold: true, size: 11 });
  worksheet.getRow(rowNum).getCell(1).font = { bold: true, size: 11, underline: true };
  rowHeight(rowNum, 18); rowNum++;

  const stmt = `I, ${empName}, ${empPos} of ${empDiv}, commits to deliver and agree to be rated on the attainment of the following targets in accordance with the indicated measures for the period of ${period}.`;
  mergeAndSet(rowNum, 1, rowNum, 8, stmt,
    { align: 'left', valign: 'middle', bold: true, size: 9, wrap: true });
  rowHeight(rowNum, 36); rowNum++;

    // Signature space for employee
  rowHeight(rowNum, 50); rowNum++;

  mergeAndSet(rowNum, 1, rowNum, 8, empName,
    { align: 'right', valign: 'middle', bold: true, size: 10 });
  rowHeight(rowNum, 14); rowNum++;

  mergeAndSet(rowNum, 1, rowNum, 8, empPos,
    { align: 'right', valign: 'middle', size: 9 });
  rowHeight(rowNum, 14); rowNum++;

  mergeAndSet(rowNum, 1, rowNum, 2, 'Reviewed by:', { align: 'left', valign: 'middle', size: 9 });
  mergeAndSet(rowNum, 5, rowNum, 8, `Date: ${empDate}`, { align: 'right', valign: 'middle', size: 9 });
  rowHeight(rowNum, 14); rowNum++;

  // Signature space for director
  rowHeight(rowNum, 50); rowNum++;

  mergeAndSet(rowNum, 1, rowNum, 4, 'Division Chief/Field Officer',
    { align: 'center', valign: 'middle', bold: true, size: 10, color: 'FFC00000' });
  mergeAndSet(rowNum, 5, rowNum, 8, dirName,
    { align: 'center', valign: 'middle', bold: true, size: 10 });
  rowHeight(rowNum, 16); rowNum++;

  mergeAndSet(rowNum, 1, rowNum, 4, 'Position',
    { align: 'center', valign: 'middle', size: 9 });
  mergeAndSet(rowNum, 5, rowNum, 8, dirTitle,
    { align: 'center', valign: 'middle', size: 9 });
  rowHeight(rowNum, 14); rowNum++;

  rowHeight(rowNum, 8); rowNum++;

  // ─── Section drawing function ──────────────────────────────
  function drawSection(title, bgColor, rows, subLabel) {

    mergeAndSet(rowNum, 1, rowNum, 8, title, {
      bold: true, size: 9, fill: bgColor,
      align: 'left', valign: 'middle', wrap: false,
      border: true,
    });
    rowHeight(rowNum, 18); rowNum++;

    rowHeight(rowNum, 6); rowNum++;

    mergeAndSet(rowNum, 4, rowNum, 7, 'SPMS Rating System', {
      bold: true, size: 8, align: 'center', valign: 'middle', border: true,
    });
    rowHeight(rowNum, 14); rowNum++;

    const headers = [
      [1, 1, 'MAJOR FINAL OUTPUTS'],
      [2, 2, 'SUCCESS INDICATORS (TARGETS + MEASURES)'],
      [3, 3, 'Accomplishments'],
      [4, 4, 'Q'],
      [5, 5, 'E'],
      [6, 6, 'T'],
      [7, 7, 'A'],
      [8, 8, 'Remarks'],
    ];
    for (const [c1, c2, label] of headers) {
      mergeAndSet(rowNum, c1, rowNum, c2, label, {
        bold: true, size: 8,
        align: 'center',
        valign: 'middle', wrap: true, border: true,
      });
    }
    rowHeight(rowNum, 28); rowNum++;

    const dataRowNumbers = [];

   

    if (rows.length === 0) {
       dataRowNumbers.push(rowNum);
      mergeAndSet(rowNum, 1, rowNum, 3, 'N/A', {
        size: 8, align: 'left', valign: 'middle', wrap: true, border: true,
      });
      setCell(rowNum, 4, '', { size: 8, align: 'center', valign: 'middle', border: true, fill: RATING_BG });
      setCell(rowNum, 5, '', { size: 8, align: 'center', valign: 'middle', border: true, fill: RATING_BG });
      setCell(rowNum, 6, '', { size: 8, align: 'center', valign: 'middle', border: true, fill: RATING_BG });
      setCell(rowNum, 7, '', { size: 8, align: 'center', valign: 'middle', border: true, fill: RATING_BG });
      setCell(rowNum, 8, '', { size: 8, align: 'left',   valign: 'middle', border: true });
      rowHeight(rowNum, 40);
      rowNum++;
    } else {
    
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        dataRowNumbers.push(rowNum);
        setCell(rowNum, 1, row.mfo || '', { size: 8, align: 'left',   valign: 'middle', wrap: true,  border: true });
        setCell(rowNum, 2, row.si  || '', { size: 8, align: 'left',   valign: 'middle', wrap: true,  border: true });
        setCell(rowNum, 3, row.acc || '', { size: 8, align: 'left',   valign: 'middle', wrap: true,  border: true });
        setCell(rowNum, 4, row.q   || '', { size: 8, align: 'center', valign: 'middle', wrap: false, border: true, fill: RATING_BG });
        setCell(rowNum, 5, row.e   || '', { size: 8, align: 'center', valign: 'middle', wrap: false, border: true, fill: RATING_BG });
        setCell(rowNum, 6, row.t   || '', { size: 8, align: 'center', valign: 'middle', wrap: false, border: true, fill: RATING_BG });

        const aCell = worksheet.getRow(rowNum).getCell(7);
        aCell.value = {
          formula: `IFERROR((D${rowNum}+E${rowNum}+F${rowNum})/3,"")`,
          result: ''
        };
        aCell.font      = { size: 8 };
        aCell.alignment = { horizontal: 'center', vertical: 'middle' };
        aCell.border    = allThin;
        aCell.numFmt    = '0.00';

        setCell(rowNum, 8, row.rem || '', { size: 8, align: 'left', valign: 'middle', wrap: true, border: true });
        rowHeight(rowNum, 40); rowNum++;
      }
    }

    mergeAndSet(rowNum, 1, rowNum, 3, `${subLabel} Sub Total`, {
      bold: true, size: 9, fill: bgColor,
      align: 'right', valign: 'middle', border: true,
    });
    mergeAndSet(rowNum, 4, rowNum, 6, 'Average', {
      size: 9, fill: bgColor,
      align: 'center', valign: 'middle', border: true,
    });

    const dataStartRow = rowNum - rows.length;
    const dataEndRow   = rowNum - 1;
    const avgCell      = worksheet.getRow(rowNum).getCell(7);
    avgCell.value = {
      formula: `IFERROR(AVERAGE(G${dataStartRow}:G${dataEndRow}),"")`,
      result: ''
    };
    avgCell.font      = { bold: true, size: 9 };
    avgCell.alignment = { horizontal: 'center', vertical: 'middle' };
    avgCell.border    = allThin;
    avgCell.fill      = solidFill(bgColor);
    avgCell.numFmt    = '0.00';

    setCell(rowNum, 8, '', { fill: bgColor, border: true, valign: 'middle' });
    rowHeight(rowNum, 18);
    const subtotalRow = rowNum;
    rowNum++;
    return { subtotalRow, dataRowNumbers };
  }

  // ─── Draw the 3 sections ──────────────────────────────────
  // AFTER
  const { subtotalRow: coreSubtotalRow,  dataRowNumbers: coreDataRows  } = drawSection(
    hasStrat ? 'CORE FUNCTION (60%)' : 'CORE FUNCTION (60%) : IF NO STRATEGIC FUNCTION (80%)',
    CORE_BG, coreRows, 'Core Function'
  );
  const { subtotalRow: stratSubtotalRow, dataRowNumbers: stratDataRows } = drawSection(
    hasStrat ? 'STRATEGIC OBJECTIVE(20%)' : 'STRATEGIC OBJECTIVE(20%) : IF WITHOUT STRATEGIC OBJECTIVE/S (0%)',
    STRAT_BG, stratRows, 'Strategic Function'
  );
  const { subtotalRow: suppSubtotalRow,  dataRowNumbers: suppDataRows  } = drawSection(
    'SUPPORT FUNCTION (20%)', SUPP_BG, suppRows, 'Support Function'
  );

  // ─── SUMMARY ──────────────────────────────────────────────
  mergeAndSet(rowNum, 1, rowNum, 8, 'SUMMARY',
    { bold: true, size: 11, align: 'left', valign: 'middle' });
  rowHeight(rowNum, 16); rowNum++;

  // Summary header row
  mergeAndSet(rowNum, 1, rowNum, 1, 'CATEGORY',         { bold: true, size: 8, align: 'center', valign: 'middle', border: true });
  mergeAndSet(rowNum, 2, rowNum, 3, 'WEIGHT',           { bold: true, size: 8, align: 'center', valign: 'middle', border: true });
  mergeAndSet(rowNum, 4, rowNum, 5, 'TOTAL',            { bold: true, size: 8, align: 'center', valign: 'middle', border: true });
  mergeAndSet(rowNum, 6, rowNum, 7, 'AVERAGE',          { bold: true, size: 8, align: 'center', valign: 'middle', border: true });
  mergeAndSet(rowNum, 8, rowNum, 8, 'WEIGHTED AVERAGE', { bold: true, size: 8, align: 'center', valign: 'middle', border: true });
  rowHeight(rowNum, 16); rowNum++;

  // Weight labels — always show the split/conditional labels
  const coreWeightLabel  = '80% / 60% (If with Strategic Function)';
  const stratWeightLabel = '20% / 0% (If without Strategic Objective)';
  const suppWeightLabel  = '20%';

  // Weights used in formulas
  const coreWeight  = hasStrat ? 0.60 : 0.80;
  const suppWeight  = 0.20;

  // ── CORE FUNCTION row ──
  const coreRow = rowNum;
  mergeAndSet(rowNum, 1, rowNum, 1, 'CORE FUNCTION', { size: 8, align: 'left', valign: 'middle', border: true });
  mergeAndSet(rowNum, 2, rowNum, 3, coreWeightLabel,  { size: 8, align: 'left', valign: 'middle', border: true });
  mergeAndSet(rowNum, 4, rowNum, 5, '',               { border: true, valign: 'middle' });
  {
    const c = worksheet.getRow(rowNum).getCell(6);
    try { worksheet.mergeCells(rowNum, 6, rowNum, 7); } catch (_) {}
    c.value = { formula: `IFERROR(G${coreSubtotalRow},"")`, result: '' };
    c.font = { size: 8 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = allThin;
    c.numFmt = '0.00';
  }
  {
    const c = worksheet.getRow(rowNum).getCell(8);
    c.value = { formula: `IFERROR(G${coreSubtotalRow}*${coreWeight},"")`, result: '' };
    c.font = { size: 8 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = allThin;
    c.numFmt = '0.00';
  }
  rowHeight(rowNum, 16); rowNum++;

  // ── STRATEGIC FUNCTION row ──
  const stratRow = rowNum;
  mergeAndSet(rowNum, 1, rowNum, 1, 'STRATEGIC FUNCTION', { size: 8, align: 'left', valign: 'middle', border: true });
  mergeAndSet(rowNum, 2, rowNum, 3, stratWeightLabel,      { size: 8, align: 'left', valign: 'middle', border: true });
  mergeAndSet(rowNum, 4, rowNum, 5, '',                    { border: true, valign: 'middle' });
  {
    const c = worksheet.getRow(rowNum).getCell(6);
    try { worksheet.mergeCells(rowNum, 6, rowNum, 7); } catch (_) {}
    if (hasStrat) {
      // Show average only when strategic rows exist
      c.value = { formula: `IFERROR(G${stratSubtotalRow},"")`, result: '' };
      c.numFmt = '0.00';
    } else {
      // Blank when no strategic function selected
      c.value = '';
    }
    c.font = { size: 8 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = allThin;
  }
  {
    const c = worksheet.getRow(rowNum).getCell(8);
    if (hasStrat) {
      // Weighted average only when strategic rows exist
      c.value = { formula: `IFERROR(G${stratSubtotalRow}*0.20,"")`, result: '' };
      c.numFmt = '0.00';
    } else {
      // Blank when no strategic function selected
      c.value = '';
    }
    c.font = { size: 8 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = allThin;
  }
  rowHeight(rowNum, 16); rowNum++;

  // ── SUPPORT FUNCTION row ──
  const suppRow = rowNum;
  mergeAndSet(rowNum, 1, rowNum, 1, 'SUPPORT FUNCTION', { size: 8, align: 'left', valign: 'middle', border: true });
  mergeAndSet(rowNum, 2, rowNum, 3, suppWeightLabel,     { size: 8, align: 'left', valign: 'middle', border: true });
  mergeAndSet(rowNum, 4, rowNum, 5, '',                  { border: true, valign: 'middle' });
  {
    const c = worksheet.getRow(rowNum).getCell(6);
    try { worksheet.mergeCells(rowNum, 6, rowNum, 7); } catch (_) {}
    c.value = { formula: `IFERROR(G${suppSubtotalRow},"")`, result: '' };
    c.font = { size: 8 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = allThin;
    c.numFmt = '0.00';
  }
  {
    const c = worksheet.getRow(rowNum).getCell(8);
    // Always calculate support weighted average (suppWeight is always 0.20)
    c.value = { formula: `IFERROR(G${suppSubtotalRow}*${suppWeight},"")`, result: '' };
    c.font = { size: 8 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = allThin;
    c.numFmt = '0.00';
  }
  rowHeight(rowNum, 16); rowNum++;

  // ── TOTAL/FINAL OVERALL RATING row ──
  // When hasStrat: core(60%) + strat(20%) + supp(20%)
  // When !hasStrat: core(80%) + supp(20%) — stratRow H cell is blank so safe to include but exclude for clarity
  mergeAndSet(rowNum, 1, rowNum, 1, 'TOTAL/FINAL OVERALL RATING', { bold: true, size: 8, align: 'left', valign: 'middle', border: true });
  mergeAndSet(rowNum, 2, rowNum, 3, '', { border: true, valign: 'middle' });
  mergeAndSet(rowNum, 4, rowNum, 5, '', { border: true, valign: 'middle' });
  mergeAndSet(rowNum, 6, rowNum, 7, '', { border: true, valign: 'middle' });
  {
    const c = worksheet.getRow(rowNum).getCell(8);
    const totalFormula = hasStrat
      ? `IFERROR(H${coreRow}+H${stratRow}+H${suppRow},"")`
      : `IFERROR(H${coreRow}+H${suppRow},"")`;
    c.value = { formula: totalFormula, result: '' };
    c.font = { bold: true, size: 8 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = allThin;
    c.numFmt = '0.00';
  }
  rowHeight(rowNum, 16);
  const totalRow = rowNum; rowNum++;

  // ── ADJECTIVAL RATING row ──
  mergeAndSet(rowNum, 1, rowNum, 1, 'ADJECTIVAL RATING', { bold: true, size: 8, align: 'left', valign: 'middle', border: true });
  mergeAndSet(rowNum, 2, rowNum, 3, '', { border: true, valign: 'middle' });
  mergeAndSet(rowNum, 4, rowNum, 5, '', { border: true, valign: 'middle' });
  mergeAndSet(rowNum, 6, rowNum, 7, '', { border: true, valign: 'middle' });
  {
    const c = worksheet.getRow(rowNum).getCell(8);
    c.value = {
      formula: `IFERROR(IF(H${totalRow}>=4.5,"Outstanding",IF(H${totalRow}>=3.5,"Very Satisfactory",IF(H${totalRow}>=2.5,"Satisfactory",IF(H${totalRow}>=1.5,"Unsatisfactory","Poor")))),"")`,
      result: ''
    };
    c.font = { bold: true, size: 8 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
    c.border = allThin;
  }
  rowHeight(rowNum, 16); rowNum++;

  // ─── Comments & Recommendations ───────────────────────────
  rowNum++;
  mergeAndSet(rowNum, 1, rowNum, 8, 'COMMENTS & RECOMMENDATIONS FOR DEVELOPMENT PURPOSES:',
    { bold: true, size: 9, align: 'left', valign: 'middle' });
  rowHeight(rowNum, 14); rowNum++;

  mergeAndSet(rowNum, 1, rowNum, 8, '', { border: true });
  rowHeight(rowNum, 45); rowNum++;

  // ─── Signature block ──────────────────────────────────────
rowNum++;

const sigStartRow = rowNum;
const sigEndRow   = rowNum + 4;

try { worksheet.mergeCells(sigStartRow, 1, sigEndRow, 1); } catch(_) {}  // A: Discussed with
try { worksheet.mergeCells(sigStartRow, 2, sigEndRow, 2); } catch(_) {}  // B: Date
try { worksheet.mergeCells(sigStartRow, 3, sigEndRow, 5); } catch(_) {}  // C-E: Assessed by
try { worksheet.mergeCells(sigStartRow, 6, sigEndRow, 6); } catch(_) {}  // F: Date
try { worksheet.mergeCells(sigStartRow, 7, sigEndRow, 7); } catch(_) {}  // G: Final Rating
try { worksheet.mergeCells(sigStartRow, 8, sigEndRow, 8); } catch(_) {}  // H: Date

// Discussed with (col A)
const dcell = worksheet.getRow(sigStartRow).getCell(1);
dcell.value     = 'Discussed with';
dcell.font      = { bold: true, size: 9 };
dcell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
dcell.border    = allThin;

// Date (col B)
const datecell = worksheet.getRow(sigStartRow).getCell(2);
datecell.value     = 'Date:';
datecell.font      = { size: 9 };
datecell.alignment = { horizontal: 'left', vertical: 'top' };
datecell.border    = allThin;

// Assessed by (col C, spanning C-E)
const acell = worksheet.getRow(sigStartRow).getCell(3);
acell.value = {
  richText: [
    { text: 'Assessed by:\n', font: { bold: true, size: 9 } },
    { text: 'I hereby certify that I discussed my\nassessment of the performance with the\nemployee', font: { italic: true, size: 8 } },
  ],
};
acell.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
acell.border    = allThin;



const d2 = worksheet.getRow(sigStartRow).getCell(6);
d2.value     = 'Date:';
d2.font      = { size: 9 };
d2.alignment = { horizontal: 'left', vertical: 'top' };
d2.border    = allThin;

// Date (col H)
const d3 = worksheet.getRow(sigStartRow).getCell(8);
d3.value     = 'Date';
d3.font      = { size: 9 };
d3.alignment = { horizontal: 'center', vertical: 'top' };
d3.border    = allThin;

const fr = worksheet.getRow(sigStartRow).getCell(7);
fr.value     = 'Final Rating';
fr.font      = { size: 9 };
fr.alignment = { horizontal: 'center', vertical: 'top' };
fr.border    = allThin;

for (let r = sigStartRow; r <= sigEndRow; r++) {
  rowHeight(r, 18);
}
rowNum = sigEndRow + 1;

 // Names row
mergeAndSet(rowNum, 1, rowNum, 1, empName,
  { bold: true, size: 9, align: 'center', valign: 'middle', wrap: true, border: true });
mergeAndSet(rowNum, 2, rowNum, 2, '', { border: true });
mergeAndSet(rowNum, 3, rowNum, 5, 'Division Chief/Field Officer',  // ← span C-E
  { bold: true, size: 9, align: 'center', valign: 'middle', border: true });
mergeAndSet(rowNum, 6, rowNum, 7, '', { border: true });
mergeAndSet(rowNum, 8, rowNum, 8, dirName,
  { bold: true, size: 9, align: 'center', valign: 'middle', wrap: true, border: true });
rowHeight(rowNum, 20); rowNum++;

// Position row
mergeAndSet(rowNum, 1, rowNum, 1, empPos,
  { size: 8, align: 'center', valign: 'middle', wrap: true, border: true });
mergeAndSet(rowNum, 2, rowNum, 2, '', { border: true });
mergeAndSet(rowNum, 3, rowNum, 5, 'Position',  // ← span C-E to match above
  { size: 8, align: 'center', valign: 'middle', border: true });
mergeAndSet(rowNum, 6, rowNum, 7, '', { border: true });
mergeAndSet(rowNum, 8, rowNum, 8, dirTitle,
  { size: 8, align: 'center', valign: 'middle', border: true });
rowHeight(rowNum, 16); rowNum++;


  // AFTER — paste the entire block above the write call
    const allEditableRows = [...coreDataRows, ...stratDataRows, ...suppDataRows];
    const EDITABLE_COLS   = [3, 4, 5, 6, 7, 8]; // C=Acc, D=Q, E=E, F=T, G=A, H=Remarks

    for (const rowIndex of allEditableRows) {
      for (const col of EDITABLE_COLS) {
        worksheet.getRow(rowIndex).getCell(col).protection = { locked: false };
      }
    }

    await worksheet.protect('ipcr2026', {
      selectLockedCells:   false, // 🔒 A, B and all headers are completely un-clickable
      selectUnlockedCells: true,  // ✅ C–H data cells are clickable and editable
      formatColumns:       true,  // ✅ Column resizing still works
      formatRows:          true,  // ✅ Row resizing still works
      formatCells:         false,
      insertColumns:       false,
      insertRows:          false,
      insertHyperlinks:    false,
      deleteColumns:       false,
      deleteRows:          false,
      sort:                false,
      autoFilter:          false,
      pivotTables:         false,
    });

  // ─── Write ────────────────────────────────────────────────
  await workbook.xlsx.write(outputStream);
}

module.exports = { generateIPCRExcel };