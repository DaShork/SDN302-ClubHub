// scripts/fill-tasks.cjs
// Đọc file Excel SDN302_SE1812_Group1.xlsx, sinh task list thực tế từ dự án
// SDN302-ClubHub, phân bổ cho 4 thành viên theo % đóng góp + vai trò, ghi đè
// Sheet2 (Task Name + Student Name).
//
// Usage:
//   node scripts/fill-tasks.cjs                 # chỉ in preview ra console
//   node scripts/fill-tasks.cjs --write        # ghi đè file Excel gốc
//   node scripts/fill-tasks.cjs --backup       # backup file gốc thành .bak.xlsx trước khi ghi

const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const FILE = process.env.EXCEL_FILE || 'C:\\Users\\Admin\\Downloads\\SDN302_SE1812_Group1.xlsx';
const SHOULD_WRITE = process.argv.includes('--write');
const SHOULD_BACKUP = process.argv.includes('--backup');

// ===== 1. Đọc % thành viên từ Sheet1 =====
function readMembers(wb) {
  const sheet1 = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet1, { header: 1, defval: null });
  // File gốc: header ở R8 (0-indexed: 8), data ở R9-R12 (0-indexed: 9..12)
  // Cột: [No, Student ID, Student Name, Class Name, Student Percent, Teacher Percent, Mark, Note]
  // Tìm header row động để tránh phụ thuộc vào số dòng trống
  let headerRowIdx = rows.findIndex((r) => r && r[1] === 'Student ID' && r[2] === 'Student Name');
  if (headerRowIdx < 0) {
    console.error('Không tìm thấy header row trong Sheet1.');
    process.exit(1);
  }
  const dataStart = headerRowIdx + 1;
  const out = [];
  for (let i = dataStart; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r[2] == null) break; // dừng khi hết data
    out.push({ name: String(r[2]), pct: Number(r[4]) || 0 });
    if (out.length === 4) break;
  }
  return out;
}

// ===== 2. Sinh task list (60 task khớp với 60 dòng trong Sheet2) =====
function buildTaskPlan() {
  // Nhóm "owner: 'LEAD'" = Võ Nhật Minh (setup + auth + BE + reviews)
  // Nhóm "owner: 'FE'" = sẽ phân bổ theo % cho 3 người còn lại
  const plan = [];

  // -------- Setup / Base / Backend (Võ Nhật Minh) — 5 task --------
  plan.push({ name: 'Setup base project (Vite + React + Tailwind + shadcn)', owner: 'LEAD' });
  plan.push({ name: 'Thiết kế Supabase schema (001_schema.sql) - 19 bảng core', owner: 'LEAD' });
  plan.push({ name: 'Cấu hình RLS policies + storage buckets (002/005/006)', owner: 'LEAD' });
  plan.push({ name: 'Tích hợp Google OAuth + Email auth + triggers auto-profile', owner: 'LEAD' });
  plan.push({ name: 'Viết seed data + 26 migrations (001-025)', owner: 'LEAD' });

  // -------- Auth Pages (Võ Nhật Minh) — 4 task --------
  plan.push({ name: 'Trang Login (email/password + Google)', owner: 'LEAD' });
  plan.push({ name: 'Trang SignUp (auto role Student)', owner: 'LEAD' });
  plan.push({ name: 'Trang ForgotPassword + ResetPassword', owner: 'LEAD' });

  // -------- Profile / Settings (Võ Nhật Minh) — 2 task --------
  plan.push({ name: 'Trang Profile + upload avatar', owner: 'LEAD' });
  plan.push({ name: 'Trang Settings (đổi MK, xóa TK, notification prefs)', owner: 'LEAD' });

  // -------- Public pages (FE - 8 task) --------
  plan.push({ name: 'HomePage (Hero + About + Category + Directory + Events)', owner: 'FE' });
  plan.push({ name: 'ClubsPage - directory 42 CLB với filter/search', owner: 'FE' });
  plan.push({ name: 'ClubDetailPage (hero, stats, leader info, join/leave, gallery)', owner: 'FE' });
  plan.push({ name: 'EventsPage + EventDetailPage (danh sách + chi tiết + đăng ký)', owner: 'FE' });
  plan.push({ name: 'AIPage - AI Assistant (knowledge search + chat history)', owner: 'FE' });
  plan.push({ name: 'AnnouncementsPage - bảng tin public + theo CLB', owner: 'FE' });
  plan.push({ name: 'GalleryPage - album ảnh CLB', owner: 'FE' });
  plan.push({ name: 'AlumniPage - danh sách cựu thành viên', owner: 'FE' });

  // -------- Student pages (FE - 6 task) --------
  plan.push({ name: 'MyClubsPage - CLB của tôi', owner: 'FE' });
  plan.push({ name: 'MyRegistrationsPage - sự kiện đã đăng ký', owner: 'FE' });
  plan.push({ name: 'CheckInPage - QR check-in sự kiện', owner: 'FE' });
  plan.push({ name: 'FinancePage + PaymentPage (sandbox/manual bank + QR)', owner: 'FE' });
  plan.push({ name: 'PaymentReturnPage - callback sau thanh toán', owner: 'FE' });
  plan.push({ name: 'NotificationsPage - trung tâm thông báo + bell', owner: 'FE' });

  // -------- Leader pages (FE - 8 task) --------
  plan.push({ name: 'LeaderDashboardPage (charts + stats)', owner: 'FE' });
  plan.push({ name: 'LeaderMembersPage (CRUD members + tab Requests)', owner: 'FE' });
  plan.push({ name: 'LeaderEventsPage (CRUD events + workshops)', owner: 'FE' });
  plan.push({ name: 'LeaderWorkshopsPage (CRUD workshops)', owner: 'FE' });
  plan.push({ name: 'LeaderAnnouncementsPage', owner: 'FE' });
  plan.push({ name: 'LeaderDocumentsPage (upload tài liệu)', owner: 'FE' });
  plan.push({ name: 'LeaderKnowledgePage (CRUD knowledge articles)', owner: 'FE' });
  plan.push({ name: 'LeaderFinancePage (đặt monthly fee + quản lý payment)', owner: 'FE' });

  // -------- Admin pages (FE - 5 task) --------
  plan.push({ name: 'AdminDashboardPage (StatsGrid + UserGrowth + RoleDistribution)', owner: 'FE' });
  plan.push({ name: 'AdminUsersPage (list/search/bulk update role/status + audit log)', owner: 'FE' });
  plan.push({ name: 'AdminClubsPage (CRUD clubs + đổi leader/mentor + archive)', owner: 'FE' });
  plan.push({ name: 'AdminRolesPage (xem RBAC grants matrix)', owner: 'FE' });
  plan.push({ name: 'AdminSettingsPage (app_settings JSONB config)', owner: 'FE' });

  // -------- Manager pages (FE - 5 task) --------
  plan.push({ name: 'ManagerDashboardPage (tổng quan CLB)', owner: 'FE' });
  plan.push({ name: 'ManagerClubsPage (quản lý CLB + gán mentor)', owner: 'FE' });
  plan.push({ name: 'ManagerAnnouncementsPage (publish platform-wide notices)', owner: 'FE' });
  plan.push({ name: 'ManagerReviewPage (duyệt events/workshops stage 2)', owner: 'FE' });
  plan.push({ name: 'ManagerActivityLogPage (audit_log viewer)', owner: 'FE' });

  // -------- Mentor pages (FE - 4 task) --------
  plan.push({ name: 'MentorDashboardPage (read-only overview)', owner: 'FE' });
  plan.push({ name: 'MentorClubsPage (CLB mình mentor)', owner: 'FE' });
  plan.push({ name: 'MentorReviewPage (duyệt events/workshops stage 1)', owner: 'FE' });
  plan.push({ name: 'MentorActivityLogPage (audit_log phạm vi CLB mentor)', owner: 'FE' });

  // -------- Member pages (FE - 3 task) --------
  plan.push({ name: 'MemberDashboardPage (tổng quan CLB của tôi)', owner: 'FE' });
  plan.push({ name: 'MemberMyClubPage (chi tiết 1 CLB của tôi)', owner: 'FE' });
  plan.push({ name: 'MemberFinancePage (trạng thái đóng phí hàng tháng)', owner: 'FE' });

  // -------- Misc (FE - 7 task) --------
  plan.push({ name: 'ReportsPage (recharts: events/month, attendance, revenue)', owner: 'FE' });
  plan.push({ name: 'RequestsPage (leader duyệt join requests)', owner: 'FE' });
  plan.push({ name: 'Edge Function: approve-item (Mentor/Manager approval workflow)', owner: 'LEAD' });
  plan.push({ name: 'Edge Function: payment-create + payment-check (manual bank)', owner: 'LEAD' });
  plan.push({ name: 'Edge Function: payment-casso-webhook + sepay-webhook', owner: 'LEAD' });
  plan.push({ name: 'Edge Function: payment-manual-confirm', owner: 'LEAD' });
  plan.push({ name: 'Mock data + UI Guidelines + README tổng hợp', owner: 'FE' });

  // -------- Service layer + Components (FE - 4 task bổ sung để đủ 60) --------
  plan.push({ name: 'Service layer: authService + clubService + eventService', owner: 'FE' });
  plan.push({ name: 'Service layer: membershipService + joinRequestService + paymentService', owner: 'FE' });
  plan.push({ name: 'Service layer: notificationService + adminStatsService + reportService', owner: 'FE' });
  plan.push({ name: 'Shared components: Navbar, Footer, Layouts, Protected/Guest Route, NotificationBell', owner: 'FE' });

  return plan;
}

// ===== 3. Phân bổ: Võ Nhật Minh cho LEAD, còn lại chia theo % =====
function distribute(plan, members) {
  const lead = members.find((m) => m.name === 'Võ Nhật Minh');
  const feMembers = members.filter((m) => m.name !== 'Võ Nhật Minh');

  // Phân bổ LEAD
  const leadTasks = plan.filter((t) => t.owner === 'LEAD').map((t) => ({
    ...t,
    owner: lead.name,
  }));

  // Phân bổ FE theo % đóng góp - dùng largest remainder để không bị lệch
  const feTasks = plan.filter((t) => t.owner === 'FE');
  const totalFePct = feMembers.reduce((s, m) => s + m.pct, 0);

  // Bước 1: tính quota thực (số thực), floor rồi lấy phần dư
  const sorted = [...feMembers].sort((a, b) => b.pct - a.pct);
  const totalFe = feTasks.length;
  const exact = sorted.map((m) => (m.pct / totalFePct) * totalFe);
  const floors = exact.map((x) => Math.floor(x));
  const remainders = exact.map((x, i) => ({ i, frac: x - floors[i] }));
  const used = floors.reduce((s, v) => s + v, 0);
  let need = totalFe - used;

  // Phân bổ phần dôi theo remainders lớn nhất trước
  remainders.sort((a, b) => b.frac - a.frac);
  const counts = [...floors];
  for (let k = 0; k < remainders.length && need > 0; k++) {
    counts[remainders[k].i] += 1;
    need -= 1;
  }
  // Phòng trường hợp cần bớt (âm) thì trừ đi từ remainders nhỏ nhất
  if (need > 0) {
    // Chia đều cho người có count lớn nhất (hiếm xảy ra khi exact < 1)
    counts[sorted.findIndex((_, i) => counts[i] === Math.max(...counts))] += need;
  }

  // Build queue: lặp từng người theo count lần
  const nameByIdx = sorted.map((m) => m.name);
  const queue = [];
  for (let i = 0; i < nameByIdx.length; i++) {
    for (let k = 0; k < counts[i]; k++) queue.push(nameByIdx[i]);
  }

  // Gán tuần tự theo queue đã build
  const feAssigned = feTasks.map((t, i) => ({
    ...t,
    owner: queue[i] || sorted[0].name,
  }));

  return [...leadTasks, ...feAssigned];
}

// ===== 4. In preview =====
function printPreview(plan, distributed, members) {
  console.log('\n=== THÀNH VIÊN VÀ % ĐÓNG GÓP ===');
  for (const m of members) {
    console.log(`  ${m.name.padEnd(20)} ${(m.pct * 100).toFixed(0)}%`);
  }

  console.log(`\n=== TỔNG SỐ TASK: ${distributed.length} ===`);
  console.log(`  LEAD (Võ Nhật Minh):  ${distributed.filter((t) => t.owner === 'Võ Nhật Minh').length} task`);
  const feCounts = {};
  distributed
    .filter((t) => t.owner !== 'Võ Nhật Minh')
    .forEach((t) => {
      feCounts[t.owner] = (feCounts[t.owner] || 0) + 1;
    });
  for (const [name, c] of Object.entries(feCounts)) {
    console.log(`  ${name.padEnd(20)} ${c} task`);
  }

  console.log('\n=== CHI TIẾT PHÂN BỔ (No | Task Name | Student Name) ===');
  distributed.forEach((t, i) => {
    console.log(`  ${String(i + 1).padStart(2, ' ')}. ${t.name.padEnd(70)} | ${t.owner}`);
  });
}

// ===== 5. Ghi đè file Excel =====
function writeToExcel(wb, distributed) {
  const sheet2 = wb.Sheets[wb.SheetNames[1]];
  // Sheet2 layout: A=No, B=Task Name, C=Percent, D=Student Name, E=Created At, F=Updated At, G=Status, H=Note
  // Header ở dòng 5 (1-indexed), data bắt đầu từ dòng 6.
  // Trong file gốc: dòng 6 chứa "No" = 1, ..., dòng 65 chứa No = 60.
  // Đọc lại vị trí data start từ file để tránh phụ thuộc cứng vào số dòng:
  //   tìm row đầu tiên có cột A là số 1, sau đó bắt đầu từ đó.
  let dataStartRow0 = -1;
  for (let R = 0; R < 200; R++) {
    const addr = xlsx.utils.encode_cell({ r: R, c: 0 });
    const cell = sheet2[addr];
    if (cell && cell.v === 1) { dataStartRow0 = R; break; }
  }
  if (dataStartRow0 < 0) {
    console.error('Không tìm thấy dòng No=1 trong Sheet2.');
    process.exit(1);
  }
  console.log(`Sheet2: data bắt đầu từ dòng ${dataStartRow0 + 1} (1-indexed)`);

  for (let i = 0; i < distributed.length; i++) {
    const rowIdx = dataStartRow0 + i; // 0-indexed
    const cellB = xlsx.utils.encode_cell({ r: rowIdx, c: 1 }); // cột B (Task Name)
    const cellD = xlsx.utils.encode_cell({ r: rowIdx, c: 3 }); // cột D (Student Name)

    sheet2[cellB] = { t: 's', v: distributed[i].name };
    sheet2[cellD] = { t: 's', v: distributed[i].owner };
  }
  xlsx.writeFile(wb, FILE);
}

// ===== 6. Main =====
function main() {
  console.log(`File: ${FILE}`);
  console.log(`Mode: ${SHOULD_WRITE ? 'WRITE' : 'PREVIEW (không ghi file)'}`);

  if (!fs.existsSync(FILE)) {
    console.error(`Không tìm thấy file: ${FILE}`);
    process.exit(1);
  }

  const wb = xlsx.readFile(FILE);
  const members = readMembers(wb);
  if (members.length !== 4) {
    console.error(`Kỳ vọng 4 thành viên, tìm thấy ${members.length}.`);
    process.exit(1);
  }

  const plan = buildTaskPlan();
  const distributed = distribute(plan, members);

  printPreview(plan, distributed, members);

  if (distributed.length !== 60) {
    console.warn(`\nCẢNH BÁO: Có ${distributed.length} task, không khớp 60 dòng Excel.`);
  }

  if (!SHOULD_WRITE) {
    console.log('\n[PREVIEW] Không có thay đổi nào được ghi vào file.');
    console.log('Chạy với --write để ghi đè, hoặc --write --backup để backup trước.');
    return;
  }

  if (SHOULD_BACKUP) {
    const backupPath = FILE.replace(/\.xlsx$/i, '.bak.xlsx');
    fs.copyFileSync(FILE, backupPath);
    console.log(`\nĐã backup: ${backupPath}`);
  }

  writeToExcel(wb, distributed);
  console.log(`\nĐã ghi đè file: ${FILE}`);
}

main();