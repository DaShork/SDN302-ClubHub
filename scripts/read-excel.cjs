// Đọc file Excel SDN302_SE1812_Group1.xlsx và in ra 2 sheet để khảo sát cấu trúc.
const path = require('path');
const fs = require('fs');

// Fallback: nếu chưa cài package, dùng cách khác không cần npm.
let xlsx;
try {
  xlsx = require('xlsx');
} catch {
  console.error('Chưa cài package "xlsx". Đang thử cách khác...');
}

const FILE = process.argv[2] || 'C:\\Users\\Admin\\Downloads\\SDN302_SE1812_Group1.xlsx';
console.log('Đọc file:', FILE);

if (xlsx) {
  const wb = xlsx.readFile(FILE);
  for (const sheetName of wb.SheetNames) {
    console.log('\n========== SHEET:', sheetName, '==========');
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws, { defval: null });
    console.log('Số dòng:', rows.length);
    if (rows.length > 0) console.log('Cột đầu tiên:', Object.keys(rows[0]));
    rows.forEach((r, i) => {
      if (i < 5) console.log(`  [${i}]`, JSON.stringify(r));
    });
    if (rows.length > 5) console.log(`  ... (còn ${rows.length - 5} dòng)`);
  }
}