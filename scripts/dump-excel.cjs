// Dump full content of both sheets.
const xlsx = require('xlsx');
const FILE = 'C:\\Users\\Admin\\Downloads\\SDN302_SE1812_Group1.xlsx';
const wb = xlsx.readFile(FILE);

for (const sheetName of wb.SheetNames) {
  console.log('\n========== SHEET:', sheetName, '==========');
  const ws = wb.Sheets[sheetName];
  const range = xlsx.utils.decode_range(ws['!ref']);
  console.log('Range:', ws['!ref'], 'rows:', range.e.r - range.s.r + 1, 'cols:', range.e.c - range.s.c + 1);
  // Use raw cell-by-cell read to get headers from row index
  const aoa = xlsx.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
  aoa.forEach((row, i) => {
    console.log(`R${i}:`, JSON.stringify(row));
  });
}