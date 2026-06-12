// Run: npm run seed
// Seeds the database from mock data if tables are empty.
import db from './database.js';

const userCount = (db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }).n;
if (userCount > 0) {
  console.log(`DB already seeded (${userCount} users). Skipping.`);
  process.exit(0);
}

// ─── Users ─────────────────────────────────────────────────
const insertUser = db.prepare(`
  INSERT INTO users (id, name, department, email, role, status, password)
  VALUES (@id, @name, @department, @email, @role, @status, @password)
`);

const users = [
  { id:'admin',         name:'Admin',         department:'ไอที',           email:'admin@bangkokseafood.co.th',         role:'it_manager', status:'active' },
  { id:'mathavee.it',   name:'Mathavee',      department:'ไอที',           email:'mathavee.it@bangkokseafood.co.th',   role:'it_staff',   status:'active' },
  { id:'purit.it',      name:'Purit',         department:'ไอที',           email:'purit.it@bangkokseafood.co.th',      role:'it_staff',   status:'active' },
  { id:'acc',           name:'Acc',           department:'บัญชี',          email:'acc@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'acc006',        name:'ACC 006',       department:'บัญชี',          email:'acc006@bangkokseafood.co.th',        role:'employee',   status:'active' },
  { id:'acc008',        name:'ACC 008',       department:'บัญชี',          email:'acc008@bangkokseafood.co.th',        role:'employee',   status:'active' },
  { id:'accounting',    name:'Accounting',    department:'บัญชี',          email:'accounting@bangkokseafood.co.th',    role:'employee',   status:'active' },
  { id:'ta.acc',        name:'Ta',            department:'บัญชี',          email:'ta.acc@bangkokseafood.co.th',        role:'employee',   status:'active' },
  { id:'hr',            name:'HR',            department:'ทรัพยากรบุคคล', email:'hr@bangkokseafood.co.th',            role:'employee',   status:'active' },
  { id:'hrmo',          name:'HR Mo',         department:'ทรัพยากรบุคคล', email:'hrmo@bangkokseafood.co.th',          role:'employee',   status:'active' },
  { id:'hrsu',          name:'HR Su',         department:'ทรัพยากรบุคคล', email:'hrsu@bangkokseafood.co.th',          role:'employee',   status:'active' },
  { id:'hrtee',         name:'HR Tee',        department:'ทรัพยากรบุคคล', email:'hrtee@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'hrying',        name:'HR Ying',       department:'ทรัพยากรบุคคล', email:'hrying@bangkokseafood.co.th',        role:'employee',   status:'active' },
  { id:'interpreter.hr',name:'Interpreter',   department:'ทรัพยากรบุคคล', email:'interpreter.hr@bangkokseafood.co.th',role:'employee',   status:'active' },
  { id:'sale',          name:'Sale',          department:'ขาย',            email:'sale@bangkokseafood.co.th',          role:'employee',   status:'active' },
  { id:'sale_admin',    name:'Sale Admin',    department:'ขาย',            email:'sale_admin@bangkokseafood.co.th',    role:'employee',   status:'active' },
  { id:'sale_admin01',  name:'Sale Admin 01', department:'ขาย',            email:'sale_admin01@bangkokseafood.co.th',  role:'employee',   status:'active' },
  { id:'cs3',           name:'CS 3',          department:'ขาย',            email:'cs3@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'cs4',           name:'CS 4',          department:'ขาย',            email:'cs4@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'cs5',           name:'CS 5',          department:'ขาย',            email:'cs5@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'cs6',           name:'CS 6',          department:'ขาย',            email:'cs6@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'cs7',           name:'CS 7',          department:'ขาย',            email:'cs7@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'cs8',           name:'CS 8',          department:'ขาย',            email:'cs8@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'cs12',          name:'CS 12',         department:'ขาย',            email:'cs12@bangkokseafood.co.th',          role:'employee',   status:'active' },
  { id:'phawinee.cs',   name:'Phawinee',      department:'ขาย',            email:'phawinee.cs@bangkokseafood.co.th',   role:'employee',   status:'active' },
  { id:'poo.cs',        name:'Poo',           department:'ขาย',            email:'poo.cs@bangkokseafood.co.th',        role:'employee',   status:'active' },
  { id:'ketsirin.c',    name:'Ketsirin',      department:'ขาย',            email:'ketsirin.c@bangkokseafood.co.th',    role:'employee',   status:'active' },
  { id:'taweewan.c',    name:'Taweewan',      department:'ขาย',            email:'taweewan.c@bangkokseafood.co.th',    role:'employee',   status:'active' },
  { id:'payroll',       name:'Payroll',       department:'เงินเดือน',      email:'payroll@bangkokseafood.co.th',       role:'employee',   status:'active' },
  { id:'epayslip',      name:'ePayslip',      department:'เงินเดือน',      email:'epayslip@bangkokseafood.co.th',      role:'employee',   status:'active' },
  { id:'imex',          name:'IMEX',          department:'IMEX',           email:'imex@bangkokseafood.co.th',          role:'employee',   status:'active' },
  { id:'imex002',       name:'IMEX 002',      department:'IMEX',           email:'imex002@bangkokseafood.co.th',       role:'employee',   status:'active' },
  { id:'wh01',          name:'WH 01',         department:'คลังสินค้า',     email:'wh01@bangkokseafood.co.th',          role:'employee',   status:'active' },
  { id:'store',         name:'Store',         department:'คลังสินค้า',     email:'store@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'wh',            name:'WH',            department:'คลังสินค้า',     email:'wh@bangkokseafood.co.th',            role:'employee',   status:'inactive' },
  { id:'pd',            name:'PD',            department:'ผลิต',           email:'pd@bangkokseafood.co.th',            role:'employee',   status:'active' },
  { id:'pd008',         name:'PD 008',        department:'ผลิต',           email:'pd008@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'pd009',         name:'PD 009',        department:'ผลิต',           email:'pd009@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'pd010',         name:'PD 010',        department:'ผลิต',           email:'pd010@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'pd013',         name:'PD 013',        department:'ผลิต',           email:'pd013@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'pd014',         name:'PD 014',        department:'ผลิต',           email:'pd014@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'pd015',         name:'PD 015',        department:'ผลิต',           email:'pd015@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'pd016',         name:'PD 016',        department:'ผลิต',           email:'pd016@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'jiraporn.pd',   name:'Jiraporn',      department:'ผลิต',           email:'jiraporn.pd@bangkokseafood.co.th',   role:'employee',   status:'active' },
  { id:'kukkikpd',      name:'Kukkik',        department:'ผลิต',           email:'kukkikpd@bangkokseafood.co.th',      role:'employee',   status:'active' },
  { id:'nutchira.pd',   name:'Nutchira',      department:'ผลิต',           email:'nutchira.pd@bangkokseafood.co.th',   role:'employee',   status:'active' },
  { id:'piyapon.pd',    name:'Piyapon',       department:'ผลิต',           email:'piyapon.pd@bangkokseafood.co.th',    role:'employee',   status:'active' },
  { id:'sarocha.pd',    name:'Sarocha',       department:'ผลิต',           email:'sarocha.pd@bangkokseafood.co.th',    role:'employee',   status:'active' },
  { id:'qa',            name:'Yui',           department:'QA/QC',          email:'qa@bangkokseafood.co.th',            role:'employee',   status:'active' },
  { id:'qa002',         name:'QA 002',        department:'QA/QC',          email:'qa002@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'qa003',         name:'QA 003',        department:'QA/QC',          email:'qa003@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'qc.lab',        name:'QC Lab',        department:'QA/QC',          email:'qc.lab@bangkokseafood.co.th',        role:'employee',   status:'active' },
  { id:'qc001',         name:'QC 001',        department:'QA/QC',          email:'qc001@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'qc004',         name:'QC 004',        department:'QA/QC',          email:'qc004@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'qc005',         name:'QC 005',        department:'QA/QC',          email:'qc005@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'qc007',         name:'QC 007',        department:'QA/QC',          email:'qc007@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'qc008',         name:'QC 008',        department:'QA/QC',          email:'qc008@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'qc009',         name:'QC 009',        department:'QA/QC',          email:'qc009@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'qc006',         name:'QC 006',        department:'QA/QC',          email:'qc006@bangkokseafood.co.th',         role:'employee',   status:'inactive' },
  { id:'quiz',          name:'Quiz',          department:'QA/QC',          email:'quiz@bangkokseafood.co.th',          role:'employee',   status:'inactive' },
  { id:'en',            name:'Engineer',      department:'วิศวกรรม',       email:'en@bangkokseafood.co.th',            role:'employee',   status:'active' },
  { id:'en001',         name:'EN 001',        department:'วิศวกรรม',       email:'en001@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'en002',         name:'EN 002',        department:'วิศวกรรม',       email:'en002@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'en003',         name:'EN 003',        department:'วิศวกรรม',       email:'en003@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'enm',           name:'EN Manager',    department:'วิศวกรรม',       email:'enm@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'rd',            name:'RD',            department:'R&D',            email:'rd@bangkokseafood.co.th',            role:'employee',   status:'active' },
  { id:'rd2',           name:'RD 2',          department:'R&D',            email:'rd2@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'rd3',           name:'RD 3',          department:'R&D',            email:'rd3@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'safety',        name:'Aonjira',       department:'ความปลอดภัย',    email:'safety@bangkokseafood.co.th',        role:'employee',   status:'active' },
  { id:'rose_safety',   name:'Suchada',       department:'ความปลอดภัย',    email:'rose_safety@bangkokseafood.co.th',   role:'employee',   status:'active' },
  { id:'ploy.pr',       name:'Ploy',          department:'ประชาสัมพันธ์',  email:'ploy.pr@bangkokseafood.co.th',       role:'employee',   status:'active' },
  { id:'pr',            name:'PR',            department:'ประชาสัมพันธ์',  email:'pr@bangkokseafood.co.th',            role:'employee',   status:'inactive' },
  { id:'fern',          name:'Fern',          department:'ทั่วไป',          email:'fern@bangkokseafood.co.th',          role:'employee',   status:'active' },
  { id:'info',          name:'Info',          department:'ทั่วไป',          email:'info@bangkokseafood.co.th',          role:'employee',   status:'active' },
  { id:'conference',    name:'Conference',    department:'ทั่วไป',          email:'conference@bangkokseafood.co.th',    role:'employee',   status:'active' },
  { id:'dc',            name:'DC',            department:'ทั่วไป',          email:'dc@bangkokseafood.co.th',            role:'employee',   status:'active' },
  { id:'joy',           name:'Joy',           department:'ทั่วไป',          email:'joy@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'pop',           name:'Jirachai',      department:'ทั่วไป',          email:'pop@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'pongpat',       name:'Pongpat',       department:'ทั่วไป',          email:'pongpat@bangkokseafood.co.th',       role:'employee',   status:'active' },
  { id:'jammy',         name:'Jammy',         department:'ทั่วไป',          email:'jammy@bangkokseafood.co.th',         role:'employee',   status:'active' },
  { id:'jirapat',       name:'Jirapat',       department:'ทั่วไป',          email:'jirapat@bangkokseafood.co.th',       role:'employee',   status:'active' },
  { id:'meaw',          name:'Meaw',          department:'ทั่วไป',          email:'meaw@bangkokseafood.co.th',          role:'employee',   status:'active' },
  { id:'min',           name:'Min',           department:'ทั่วไป',          email:'min@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'nantawan.b',    name:'Nantawan',      department:'ทั่วไป',          email:'nantawan.b@bangkokseafood.co.th',    role:'employee',   status:'active' },
  { id:'nok',           name:'Nok',           department:'ทั่วไป',          email:'nok@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'nontawan',      name:'Nontawan',      department:'ทั่วไป',          email:'nontawan@bangkokseafood.co.th',      role:'employee',   status:'active' },
  { id:'nuch',          name:'Nuch',          department:'ทั่วไป',          email:'nuch@bangkokseafood.co.th',          role:'employee',   status:'active' },
  { id:'oil',           name:'Oil',           department:'ทั่วไป',          email:'oil@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'som',           name:'Som',           department:'ทั่วไป',          email:'som@bangkokseafood.co.th',           role:'employee',   status:'active' },
  { id:'sirirat.b',     name:'Sirirat',       department:'ทั่วไป',          email:'sirirat.b@bangkokseafood.co.th',     role:'employee',   status:'active' },
  { id:'yodkhwan.p',    name:'Yodkhwan',      department:'ทั่วไป',          email:'yodkhwan.p@bangkokseafood.co.th',    role:'employee',   status:'active' },
  { id:'theptat.b',     name:'Theptat',       department:'ทั่วไป',          email:'theptat.b@bangkokseafood.co.th',     role:'employee',   status:'active' },
  { id:'suphitsara.t',  name:'Suphitsara',    department:'ทั่วไป',          email:'suphitsara.t@bangkokseafood.co.th',  role:'employee',   status:'active' },
  { id:'somchai.k',     name:'Somchai',       department:'ทั่วไป',          email:'somchai.k@bangkokseafood.co.th',     role:'employee',   status:'active' },
  { id:'khawnporn.p',   name:'Khawnporn',     department:'ทั่วไป',          email:'khawnporn.p@bangkokseafood.co.th',   role:'employee',   status:'active' },
];

const seedUsers = db.transaction(() => {
  for (const u of users) insertUser.run({ ...u, password: 'Com@1234' });
});
seedUsers();
console.log(`✓ ${users.length} users seeded`);

// ─── Services ──────────────────────────────────────────────
const insertService = db.prepare(`
  INSERT INTO services (id, name, name_en, status, last_checked, uptime_percent, description)
  VALUES (@id, @name, @nameEn, @status, @lastChecked, @uptimePercent, @description)
`);
const now = new Date().toISOString();
const services = [
  { id:'svc-1', name:'อินเทอร์เน็ต',  nameEn:'Internet',     status:'degraded',       lastChecked:now, uptimePercent:94.2, description:'การเชื่อมต่ออินเทอร์เน็ตหลัก ISP 1 Gbps' },
  { id:'svc-2', name:'Email Server',  nameEn:'Email Server', status:'operational',    lastChecked:now, uptimePercent:99.8, description:'Microsoft Exchange On-Premises' },
  { id:'svc-3', name:'VPN',           nameEn:'VPN',          status:'operational',    lastChecked:now, uptimePercent:99.1, description:'Fortinet SSL VPN Gateway' },
  { id:'svc-4', name:'ระบบ ERP',      nameEn:'ERP System',   status:'partial_outage', lastChecked:now, uptimePercent:87.5, description:'SAP Business One Application Server' },
  { id:'svc-5', name:'File Server',   nameEn:'File Server',  status:'operational',    lastChecked:now, uptimePercent:99.5, description:'Windows File Server - Shared Drives' },
  { id:'svc-6', name:'Print Server',  nameEn:'Print Server', status:'operational',    lastChecked:now, uptimePercent:98.7, description:'Print Server ควบคุมเครื่องพิมพ์ทั้งอาคาร' },
  { id:'svc-7', name:'Wi-Fi',         nameEn:'Wi-Fi',        status:'operational',    lastChecked:now, uptimePercent:97.3, description:'Wireless Network ทั้งอาคาร' },
  { id:'svc-8', name:'ระบบ HR',       nameEn:'HR System',    status:'maintenance',    lastChecked:now, uptimePercent:99.0, description:'ระบบทรัพยากรบุคคล HRi Cloud' },
];
const seedServices = db.transaction(() => {
  for (const s of services) insertService.run(s);
});
seedServices();
console.log(`✓ ${services.length} services seeded`);

// ─── Sample Tickets (20 tickets) ───────────────────────────
const insertTicket = db.prepare(`
  INSERT INTO tickets (id, title, description, category, priority, status, requester_id, requester_name, department, email, assignee_id, assignee_name, sla_due_time, created_at, updated_at)
  VALUES (@id, @title, @description, @category, @priority, @status, @requesterId, @requesterName, @department, @email, @assigneeId, @assigneeName, @slaDueTime, @createdAt, @updatedAt)
`);
const insertTimeline = db.prepare(`
  INSERT INTO ticket_timeline (id, ticket_id, from_status, to_status, changed_by, timestamp)
  VALUES (@id, @ticketId, @fromStatus, @toStatus, @changedBy, @timestamp)
`);
const insertComment = db.prepare(`
  INSERT INTO comments (id, ticket_id, user_id, user_name, user_role, message, is_internal, timestamp)
  VALUES (@id, @ticketId, @userId, @userName, @userRole, @message, @isInternal, @timestamp)
`);

const d = (daysAgo: number, hoursAgo = 0) => {
  const dt = new Date('2026-05-23T09:00:00');
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(dt.getHours() - hoursAgo);
  return dt.toISOString();
};

const tickets = [
  { id:'TKT-001', title:'อินเทอร์เน็ตใช้งานไม่ได้ที่แผนกบัญชี', description:'อินเทอร์เน็ตดับมาตั้งแต่เช้า 8 โมง', category:'internet', priority:'high', status:'in_progress', requesterId:'fern', requesterName:'Fern', department:'ทั่วไป', email:'fern@bangkokseafood.co.th', assigneeId:'mathavee.it', assigneeName:'Mathavee', slaDueTime:d(0,-4), createdAt:d(0,4), updatedAt:d(0,2) },
  { id:'TKT-002', title:'ไม่สามารถเข้าสู่ระบบ ERP ได้', description:'เข้าสู่ระบบ ERP ไม่ได้ตั้งแต่เมื่อวาน', category:'erp', priority:'critical', status:'assigned', requesterId:'acc006', requesterName:'ACC 006', department:'บัญชี', email:'acc006@bangkokseafood.co.th', assigneeId:'purit.it', assigneeName:'Purit', slaDueTime:d(-1,-2), createdAt:d(1,3), updatedAt:d(1,1) },
  { id:'TKT-003', title:'เครื่องพิมพ์ชั้น 3 ไม่ทำงาน', description:'เครื่องพิมพ์ HP LaserJet ชั้น 3 ไม่สามารถพิมพ์งานได้', category:'printer', priority:'medium', status:'new', requesterId:'hr', requesterName:'HR', department:'ทรัพยากรบุคคล', email:'hr@bangkokseafood.co.th', assigneeId:null, assigneeName:null, slaDueTime:d(-1,-6), createdAt:d(1), updatedAt:d(1) },
  { id:'TKT-004', title:'Outlook ไม่ sync อีเมลใหม่', description:'อีเมลไม่ sync ตั้งแต่วันที่ 20 พ.ค.', category:'email', priority:'medium', status:'resolved', requesterId:'sale', requesterName:'Sale', department:'ขาย', email:'sale@bangkokseafood.co.th', assigneeId:'mathavee.it', assigneeName:'Mathavee', slaDueTime:d(2,-4), createdAt:d(3), updatedAt:d(2) },
  { id:'TKT-005', title:'VPN หลุดตลอดเวลา ทำงาน Remote ไม่ได้', description:'VPN หลุดทุก 10-15 นาที', category:'vpn', priority:'high', status:'in_progress', requesterId:'imex', requesterName:'IMEX', department:'IMEX', email:'imex@bangkokseafood.co.th', assigneeId:'purit.it', assigneeName:'Purit', slaDueTime:d(0,-6), createdAt:d(0,6), updatedAt:d(0,3) },
  { id:'TKT-006', title:'บัญชีผู้ใช้ถูกล็อค เข้าระบบไม่ได้', description:'เช้านี้เข้า Windows ไม่ได้ แจ้งว่า Account is locked out', category:'account', priority:'medium', status:'waiting_user', requesterId:'wh01', requesterName:'WH 01', department:'คลังสินค้า', email:'wh01@bangkokseafood.co.th', assigneeId:'mathavee.it', assigneeName:'Mathavee', slaDueTime:d(0,-8), createdAt:d(0,8), updatedAt:d(0,5) },
  { id:'TKT-007', title:'ขอติดตั้งโปรแกรม Adobe Acrobat', description:'ต้องการใช้ Adobe Acrobat Pro สำหรับแก้ไข PDF', category:'software', priority:'low', status:'new', requesterId:'hr', requesterName:'HR', department:'ทรัพยากรบุคคล', email:'hr@bangkokseafood.co.th', assigneeId:null, assigneeName:null, slaDueTime:d(-3), createdAt:d(2), updatedAt:d(2) },
  { id:'TKT-008', title:'อีเมล Phishing น่าสงสัย - Security Alert', description:'ได้รับอีเมลจาก noreply@microsoft-support.net น่าสงสัย', category:'security', priority:'critical', status:'assigned', requesterId:'fern', requesterName:'Fern', department:'ทั่วไป', email:'fern@bangkokseafood.co.th', assigneeId:'admin', assigneeName:'Admin', slaDueTime:d(0,-1), createdAt:d(0,5), updatedAt:d(0,4) },
  { id:'TKT-009', title:'คอมพิวเตอร์ทำงานช้ามากจนทำงานไม่ได้', description:'CPU 100% ตลอดเวลา เปิด Excel ใช้เวลา 5 นาที', category:'computer', priority:'low', status:'in_progress', requesterId:'acc006', requesterName:'ACC 006', department:'บัญชี', email:'acc006@bangkokseafood.co.th', assigneeId:'mathavee.it', assigneeName:'Mathavee', slaDueTime:d(1), createdAt:d(4), updatedAt:d(3) },
  { id:'TKT-010', title:'Microsoft Teams โทรออกไม่ได้', description:'Teams โทรหาลูกค้าภายนอกไม่ได้ ขึ้น error Call failed', category:'software', priority:'medium', status:'closed', requesterId:'sale', requesterName:'Sale', department:'ขาย', email:'sale@bangkokseafood.co.th', assigneeId:'purit.it', assigneeName:'Purit', slaDueTime:d(4), createdAt:d(6), updatedAt:d(5) },
  { id:'TKT-011', title:'ลืมรหัสผ่าน Windows', description:'ลืมรหัสผ่านเข้า Windows หลังจากกลับมาจากลาพัก', category:'account', priority:'low', status:'closed', requesterId:'imex', requesterName:'IMEX', department:'IMEX', email:'imex@bangkokseafood.co.th', assigneeId:'mathavee.it', assigneeName:'Mathavee', slaDueTime:d(7), createdAt:d(10), updatedAt:d(10) },
  { id:'TKT-012', title:'เข้า Network Drive ไม่ได้', description:'เข้า shared drive ไม่ได้ตั้งแต่เมื่อวาน', category:'other', priority:'high', status:'assigned', requesterId:'wh01', requesterName:'WH 01', department:'คลังสินค้า', email:'wh01@bangkokseafood.co.th', assigneeId:'purit.it', assigneeName:'Purit', slaDueTime:d(-1,-3), createdAt:d(1,5), updatedAt:d(1,2) },
  { id:'TKT-013', title:'Report ERP แสดงข้อมูลไม่ถูกต้อง', description:'ยอดขายรายเดือนใน ERP ต่างกับ Excel หลายแสนบาท', category:'erp', priority:'high', status:'in_progress', requesterId:'sale', requesterName:'Sale', department:'ขาย', email:'sale@bangkokseafood.co.th', assigneeId:'admin', assigneeName:'Admin', slaDueTime:d(-1), createdAt:d(2), updatedAt:d(1) },
  { id:'TKT-014', title:'จอ Monitor มีเส้นสีขาวแนวตั้ง', description:'จอมอนิเตอร์มีเส้นสีขาวแนวตั้ง 3 เส้น', category:'computer', priority:'medium', status:'new', requesterId:'hr', requesterName:'HR', department:'ทรัพยากรบุคคล', email:'hr@bangkokseafood.co.th', assigneeId:null, assigneeName:null, slaDueTime:d(-2), createdAt:d(1,1), updatedAt:d(1,1) },
  { id:'TKT-015', title:'Wi-Fi ห้องประชุม A หลุดบ่อย', description:'Wi-Fi ห้องประชุม A ชั้น 5 หลุดทุก 20-30 นาที', category:'internet', priority:'medium', status:'new', requesterId:'imex', requesterName:'IMEX', department:'IMEX', email:'imex@bangkokseafood.co.th', assigneeId:null, assigneeName:null, slaDueTime:d(-1,-5), createdAt:d(2), updatedAt:d(2) },
  { id:'TKT-016', title:'ส่งอีเมลออกไม่ได้ - Domain ถูก Block', description:'ส่งอีเมลออกไปที่ partner ไม่ได้ ระบบแจ้ง rejected as spam', category:'email', priority:'high', status:'waiting_user', requesterId:'payroll', requesterName:'Payroll', department:'เงินเดือน', email:'payroll@bangkokseafood.co.th', assigneeId:'mathavee.it', assigneeName:'Mathavee', slaDueTime:d(-1,-4), createdAt:d(2), updatedAt:d(1) },
  { id:'TKT-017', title:'Windows Update ติดตั้งไม่ได้ - Error 0x800705B4', description:'Windows Update ค้างที่ 35% และ error ทุกครั้ง', category:'computer', priority:'medium', status:'in_progress', requesterId:'wh01', requesterName:'WH 01', department:'คลังสินค้า', email:'wh01@bangkokseafood.co.th', assigneeId:'purit.it', assigneeName:'Purit', slaDueTime:d(2), createdAt:d(5), updatedAt:d(4) },
  { id:'TKT-018', title:'ขอติดตั้งเครื่องพิมพ์ใหม่ HP ชั้น 2', description:'ต้องการติดตั้ง HP LaserJet Pro เครื่องใหม่', category:'printer', priority:'low', status:'resolved', requesterId:'acc006', requesterName:'ACC 006', department:'บัญชี', email:'acc006@bangkokseafood.co.th', assigneeId:'mathavee.it', assigneeName:'Mathavee', slaDueTime:d(5), createdAt:d(8), updatedAt:d(7) },
  { id:'TKT-019', title:'ขอสิทธิ์เข้าถึง Folder HR Confidential', description:'ต้องการสิทธิ์ read-only สำหรับงาน audit', category:'account', priority:'medium', status:'new', requesterId:'hr', requesterName:'HR', department:'ทรัพยากรบุคคล', email:'hr@bangkokseafood.co.th', assigneeId:null, assigneeName:null, slaDueTime:d(-1), createdAt:d(1,2), updatedAt:d(1,2) },
  { id:'TKT-020', title:'Server หลักดับกระทบทุกแผนก - CRITICAL', description:'Server ห้อง Data Center ดับกะทันหัน ระบบทุกระบบใช้งานไม่ได้', category:'other', priority:'critical', status:'reopened', requesterId:'wh01', requesterName:'WH 01', department:'คลังสินค้า', email:'wh01@bangkokseafood.co.th', assigneeId:'admin', assigneeName:'Admin', slaDueTime:d(-1,-6), createdAt:d(3,6), updatedAt:d(0,2) },
];

const seedTickets = db.transaction(() => {
  for (const t of tickets) {
    insertTicket.run(t);
    insertTimeline.run({ id:`tl-${t.id}-1`, ticketId:t.id, fromStatus:null, toStatus:'new', changedBy:'ระบบ', timestamp:t.createdAt });
    if (t.assigneeId) {
      insertTimeline.run({ id:`tl-${t.id}-2`, ticketId:t.id, fromStatus:'new', toStatus:'assigned', changedBy:t.assigneeName, timestamp:t.updatedAt });
    }
  }
  // Sample comments
  insertComment.run({ id:'c-001-1', ticketId:'TKT-001', userId:'fern', userName:'Fern', userRole:'employee', message:'ลองรีสตาร์ทเครื่องแล้วยังคงใช้งานไม่ได้ครับ', isInternal:0, timestamp:d(0,3) });
  insertComment.run({ id:'c-001-2', ticketId:'TKT-001', userId:'mathavee.it', userName:'Mathavee', userRole:'it_staff', message:'รับทราบค่ะ กำลังตรวจสอบ network switch ที่ชั้น 3', isInternal:0, timestamp:d(0,2) });
  insertComment.run({ id:'n-001-1', ticketId:'TKT-001', userId:'mathavee.it', userName:'Mathavee', userRole:'it_staff', message:'ตรวจพบ switch port เสีย 3 port บน patch panel ชั้น 3', isInternal:1, timestamp:d(0,2) });
  insertComment.run({ id:'c-004-1', ticketId:'TKT-004', userId:'mathavee.it', userName:'Mathavee', userRole:'it_staff', message:'แก้ไขเรียบร้อยแล้วค่ะ สาเหตุเกิดจาก Outlook profile เสีย', isInternal:0, timestamp:d(2) });
  insertComment.run({ id:'c-008-1', ticketId:'TKT-008', userId:'admin', userName:'Admin', userRole:'it_manager', message:'รับทราบค่ะ ห้ามคลิก link ใดๆ ในอีเมลนั้นเด็ดขาดนะคะ', isInternal:0, timestamp:d(0,4) });
});
seedTickets();
console.log(`✓ ${tickets.length} tickets seeded`);

// ─── Incidents ─────────────────────────────────────────────
const insertIncident = db.prepare(`
  INSERT INTO incidents (id, title, description, affected_services, status, severity, created_at, updated_at, created_by)
  VALUES (@id, @title, @description, @affectedServices, @status, @severity, @createdAt, @updatedAt, @createdBy)
`);
const seedIncidents = db.transaction(() => {
  insertIncident.run({ id:'INC-001', title:'ระบบ ERP ตอบสนองช้าและ Login ไม่ได้บางผู้ใช้', description:'ERP Application Server มี connection pool exhausted', affectedServices:'["svc-4"]', status:'identified', severity:'high', createdAt:d(1,3), updatedAt:d(1), createdBy:'Admin' });
  insertIncident.run({ id:'INC-002', title:'อินเทอร์เน็ตความเร็วต่ำกว่าปกติ - ISP Issue', description:'ความเร็วอินเทอร์เน็ตลดลงเหลือ 30%', affectedServices:'["svc-1"]', status:'monitoring', severity:'medium', createdAt:d(0,5), updatedAt:d(0,2), createdBy:'Purit' });
  insertIncident.run({ id:'INC-003', title:'ระบบ Server หลักดับ', description:'Primary Server PSU เสียทำให้ระบบดับกะทันหัน', affectedServices:'["svc-4","svc-5","svc-6"]', status:'monitoring', severity:'critical', createdAt:d(3,6), updatedAt:d(0,2), createdBy:'Admin' });
});
seedIncidents();
console.log(`✓ 3 incidents seeded`);

console.log('\nDatabase seeded successfully!');
process.exit(0);
