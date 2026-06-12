import type {
  User, Ticket, Comment, StatusChange,
  Service, Incident, Maintenance, KBArticle
} from '../types';

// ─── Users ────────────────────────────────────────────────
export const mockUsers: User[] = [
  // ── IT ──
  { id: 'admin',         name: 'Admin',         department: 'ไอที',           email: 'admin@bangkokseafood.co.th',         role: 'it_manager', status: 'active' },
  { id: 'mathavee.it',   name: 'Mathavee',      department: 'ไอที',           email: 'mathavee.it@bangkokseafood.co.th',   role: 'it_staff',   status: 'active' },
  { id: 'purit.it',      name: 'Purit',         department: 'ไอที',           email: 'purit.it@bangkokseafood.co.th',      role: 'it_staff',   status: 'active' },

  // ── บัญชี ──
  { id: 'acc',           name: 'Acc',           department: 'บัญชี',          email: 'acc@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'acc006',        name: 'ACC 006',       department: 'บัญชี',          email: 'acc006@bangkokseafood.co.th',        role: 'employee',   status: 'active' },
  { id: 'acc008',        name: 'ACC 008',       department: 'บัญชี',          email: 'acc008@bangkokseafood.co.th',        role: 'employee',   status: 'active' },
  { id: 'accounting',    name: 'Accounting',    department: 'บัญชี',          email: 'accounting@bangkokseafood.co.th',    role: 'employee',   status: 'active' },
  { id: 'ta.acc',        name: 'Ta',            department: 'บัญชี',          email: 'ta.acc@bangkokseafood.co.th',        role: 'employee',   status: 'active' },

  // ── ทรัพยากรบุคคล ──
  { id: 'hr',            name: 'HR',            department: 'ทรัพยากรบุคคล', email: 'hr@bangkokseafood.co.th',            role: 'employee',   status: 'active' },
  { id: 'hrmo',          name: 'HR Mo',         department: 'ทรัพยากรบุคคล', email: 'hrmo@bangkokseafood.co.th',          role: 'employee',   status: 'active' },
  { id: 'hrsu',          name: 'HR Su',         department: 'ทรัพยากรบุคคล', email: 'hrsu@bangkokseafood.co.th',          role: 'employee',   status: 'active' },
  { id: 'hrtee',         name: 'HR Tee',        department: 'ทรัพยากรบุคคล', email: 'hrtee@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'hrying',        name: 'HR Ying',       department: 'ทรัพยากรบุคคล', email: 'hrying@bangkokseafood.co.th',        role: 'employee',   status: 'active' },
  { id: 'interpreter.hr',name: 'Interpreter',   department: 'ทรัพยากรบุคคล', email: 'interpreter.hr@bangkokseafood.co.th',role: 'employee',   status: 'active' },

  // ── ขาย / CS ──
  { id: 'sale',          name: 'Sale',          department: 'ขาย',            email: 'sale@bangkokseafood.co.th',          role: 'employee',   status: 'active' },
  { id: 'sale_admin',    name: 'Sale Admin',    department: 'ขาย',            email: 'sale_admin@bangkokseafood.co.th',    role: 'employee',   status: 'active' },
  { id: 'sale_admin01',  name: 'Sale Admin 01', department: 'ขาย',            email: 'sale_admin01@bangkokseafood.co.th',  role: 'employee',   status: 'active' },
  { id: 'cs3',           name: 'CS 3',          department: 'ขาย',            email: 'cs3@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'cs4',           name: 'CS 4',          department: 'ขาย',            email: 'cs4@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'cs5',           name: 'CS 5',          department: 'ขาย',            email: 'cs5@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'cs6',           name: 'CS 6',          department: 'ขาย',            email: 'cs6@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'cs7',           name: 'CS 7',          department: 'ขาย',            email: 'cs7@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'cs8',           name: 'CS 8',          department: 'ขาย',            email: 'cs8@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'cs12',          name: 'CS 12',         department: 'ขาย',            email: 'cs12@bangkokseafood.co.th',          role: 'employee',   status: 'active' },
  { id: 'phawinee.cs',   name: 'Phawinee',      department: 'ขาย',            email: 'phawinee.cs@bangkokseafood.co.th',   role: 'employee',   status: 'active' },
  { id: 'poo.cs',        name: 'Poo',           department: 'ขาย',            email: 'poo.cs@bangkokseafood.co.th',        role: 'employee',   status: 'active' },
  { id: 'ketsirin.c',    name: 'Ketsirin',      department: 'ขาย',            email: 'ketsirin.c@bangkokseafood.co.th',    role: 'employee',   status: 'active' },
  { id: 'taweewan.c',    name: 'Taweewan',      department: 'ขาย',            email: 'taweewan.c@bangkokseafood.co.th',    role: 'employee',   status: 'active' },

  // ── เงินเดือน ──
  { id: 'payroll',       name: 'Payroll',       department: 'เงินเดือน',      email: 'payroll@bangkokseafood.co.th',       role: 'employee',   status: 'active' },
  { id: 'epayslip',      name: 'ePayslip',      department: 'เงินเดือน',      email: 'epayslip@bangkokseafood.co.th',      role: 'employee',   status: 'active' },

  // ── IMEX ──
  { id: 'imex',          name: 'IMEX',          department: 'IMEX',           email: 'imex@bangkokseafood.co.th',          role: 'employee',   status: 'active' },
  { id: 'imex002',       name: 'IMEX 002',      department: 'IMEX',           email: 'imex002@bangkokseafood.co.th',       role: 'employee',   status: 'active' },

  // ── คลังสินค้า ──
  { id: 'wh01',          name: 'WH 01',         department: 'คลังสินค้า',     email: 'wh01@bangkokseafood.co.th',          role: 'employee',   status: 'active' },
  { id: 'store',         name: 'Store',         department: 'คลังสินค้า',     email: 'store@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'wh',            name: 'WH',            department: 'คลังสินค้า',     email: 'wh@bangkokseafood.co.th',            role: 'employee',   status: 'inactive' },

  // ── ผลิต ──
  { id: 'pd',            name: 'PD',            department: 'ผลิต',           email: 'pd@bangkokseafood.co.th',            role: 'employee',   status: 'active' },
  { id: 'pd008',         name: 'PD 008',        department: 'ผลิต',           email: 'pd008@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'pd009',         name: 'PD 009',        department: 'ผลิต',           email: 'pd009@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'pd010',         name: 'PD 010',        department: 'ผลิต',           email: 'pd010@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'pd013',         name: 'PD 013',        department: 'ผลิต',           email: 'pd013@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'pd014',         name: 'PD 014',        department: 'ผลิต',           email: 'pd014@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'pd015',         name: 'PD 015',        department: 'ผลิต',           email: 'pd015@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'pd016',         name: 'PD 016',        department: 'ผลิต',           email: 'pd016@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'jiraporn.pd',   name: 'Jiraporn',      department: 'ผลิต',           email: 'jiraporn.pd@bangkokseafood.co.th',   role: 'employee',   status: 'active' },
  { id: 'kukkikpd',      name: 'Kukkik',        department: 'ผลิต',           email: 'kukkikpd@bangkokseafood.co.th',      role: 'employee',   status: 'active' },
  { id: 'nutchira.pd',   name: 'Nutchira',      department: 'ผลิต',           email: 'nutchira.pd@bangkokseafood.co.th',   role: 'employee',   status: 'active' },
  { id: 'piyapon.pd',    name: 'Piyapon',       department: 'ผลิต',           email: 'piyapon.pd@bangkokseafood.co.th',    role: 'employee',   status: 'active' },
  { id: 'sarocha.pd',    name: 'Sarocha',       department: 'ผลิต',           email: 'sarocha.pd@bangkokseafood.co.th',    role: 'employee',   status: 'active' },

  // ── QA/QC ──
  { id: 'qa',            name: 'Yui',           department: 'QA/QC',          email: 'qa@bangkokseafood.co.th',            role: 'employee',   status: 'active' },
  { id: 'qa002',         name: 'QA 002',        department: 'QA/QC',          email: 'qa002@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'qa003',         name: 'QA 003',        department: 'QA/QC',          email: 'qa003@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'qc.lab',        name: 'QC Lab',        department: 'QA/QC',          email: 'qc.lab@bangkokseafood.co.th',        role: 'employee',   status: 'active' },
  { id: 'qc001',         name: 'QC 001',        department: 'QA/QC',          email: 'qc001@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'qc004',         name: 'QC 004',        department: 'QA/QC',          email: 'qc004@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'qc005',         name: 'QC 005',        department: 'QA/QC',          email: 'qc005@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'qc007',         name: 'QC 007',        department: 'QA/QC',          email: 'qc007@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'qc008',         name: 'QC 008',        department: 'QA/QC',          email: 'qc008@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'qc009',         name: 'QC 009',        department: 'QA/QC',          email: 'qc009@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'qc006',         name: 'QC 006',        department: 'QA/QC',          email: 'qc006@bangkokseafood.co.th',         role: 'employee',   status: 'inactive' },
  { id: 'quiz',          name: 'Quiz',          department: 'QA/QC',          email: 'quiz@bangkokseafood.co.th',          role: 'employee',   status: 'inactive' },

  // ── วิศวกรรม ──
  { id: 'en',            name: 'Engineer',      department: 'วิศวกรรม',       email: 'en@bangkokseafood.co.th',            role: 'employee',   status: 'active' },
  { id: 'en001',         name: 'EN 001',        department: 'วิศวกรรม',       email: 'en001@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'en002',         name: 'EN 002',        department: 'วิศวกรรม',       email: 'en002@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'en003',         name: 'EN 003',        department: 'วิศวกรรม',       email: 'en003@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'enm',           name: 'EN Manager',    department: 'วิศวกรรม',       email: 'enm@bangkokseafood.co.th',           role: 'employee',   status: 'active' },

  // ── R&D ──
  { id: 'rd',            name: 'RD',            department: 'R&D',            email: 'rd@bangkokseafood.co.th',            role: 'employee',   status: 'active' },
  { id: 'rd2',           name: 'RD 2',          department: 'R&D',            email: 'rd2@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'rd3',           name: 'RD 3',          department: 'R&D',            email: 'rd3@bangkokseafood.co.th',           role: 'employee',   status: 'active' },

  // ── ความปลอดภัย ──
  { id: 'safety',        name: 'Aonjira',       department: 'ความปลอดภัย',    email: 'safety@bangkokseafood.co.th',        role: 'employee',   status: 'active' },
  { id: 'rose_safety',   name: 'Suchada',       department: 'ความปลอดภัย',    email: 'rose_safety@bangkokseafood.co.th',   role: 'employee',   status: 'active' },

  // ── ประชาสัมพันธ์ ──
  { id: 'ploy.pr',       name: 'Ploy',          department: 'ประชาสัมพันธ์',  email: 'ploy.pr@bangkokseafood.co.th',       role: 'employee',   status: 'active' },
  { id: 'pr',            name: 'PR',            department: 'ประชาสัมพันธ์',  email: 'pr@bangkokseafood.co.th',            role: 'employee',   status: 'inactive' },

  // ── ทั่วไป ──
  { id: 'fern',          name: 'Fern',          department: 'ทั่วไป',          email: 'fern@bangkokseafood.co.th',          role: 'employee',   status: 'active' },
  { id: 'info',          name: 'Info',          department: 'ทั่วไป',          email: 'info@bangkokseafood.co.th',          role: 'employee',   status: 'active' },
  { id: 'conference',    name: 'Conference',    department: 'ทั่วไป',          email: 'conference@bangkokseafood.co.th',    role: 'employee',   status: 'active' },
  { id: 'dc',            name: 'DC',            department: 'ทั่วไป',          email: 'dc@bangkokseafood.co.th',            role: 'employee',   status: 'active' },
  { id: 'joy',           name: 'Joy',           department: 'ทั่วไป',          email: 'joy@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'pop',           name: 'Jirachai',      department: 'ทั่วไป',          email: 'pop@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'pongpat',       name: 'Pongpat',       department: 'ทั่วไป',          email: 'pongpat@bangkokseafood.co.th',       role: 'employee',   status: 'active' },
  { id: 'jammy',         name: 'Jammy',         department: 'ทั่วไป',          email: 'jammy@bangkokseafood.co.th',         role: 'employee',   status: 'active' },
  { id: 'jirapat',       name: 'Jirapat',       department: 'ทั่วไป',          email: 'jirapat@bangkokseafood.co.th',       role: 'employee',   status: 'active' },
  { id: 'meaw',          name: 'Meaw',          department: 'ทั่วไป',          email: 'meaw@bangkokseafood.co.th',          role: 'employee',   status: 'active' },
  { id: 'min',           name: 'Min',           department: 'ทั่วไป',          email: 'min@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'nantawan.b',    name: 'Nantawan',      department: 'ทั่วไป',          email: 'nantawan.b@bangkokseafood.co.th',    role: 'employee',   status: 'active' },
  { id: 'nok',           name: 'Nok',           department: 'ทั่วไป',          email: 'nok@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'nontawan',      name: 'Nontawan',      department: 'ทั่วไป',          email: 'nontawan@bangkokseafood.co.th',      role: 'employee',   status: 'active' },
  { id: 'nuch',          name: 'Nuch',          department: 'ทั่วไป',          email: 'nuch@bangkokseafood.co.th',          role: 'employee',   status: 'active' },
  { id: 'oil',           name: 'Oil',           department: 'ทั่วไป',          email: 'oil@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'som',           name: 'Som',           department: 'ทั่วไป',          email: 'som@bangkokseafood.co.th',           role: 'employee',   status: 'active' },
  { id: 'sirirat.b',     name: 'Sirirat',       department: 'ทั่วไป',          email: 'sirirat.b@bangkokseafood.co.th',     role: 'employee',   status: 'active' },
  { id: 'yodkhwan.p',    name: 'Yodkhwan',      department: 'ทั่วไป',          email: 'yodkhwan.p@bangkokseafood.co.th',    role: 'employee',   status: 'active' },
  { id: 'theptat.b',     name: 'Theptat',       department: 'ทั่วไป',          email: 'theptat.b@bangkokseafood.co.th',     role: 'employee',   status: 'active' },
  { id: 'suphitsara.t',  name: 'Suphitsara',    department: 'ทั่วไป',          email: 'suphitsara.t@bangkokseafood.co.th',  role: 'employee',   status: 'active' },
  { id: 'somchai.k',     name: 'Somchai',       department: 'ทั่วไป',          email: 'somchai.k@bangkokseafood.co.th',     role: 'employee',   status: 'active' },
  { id: 'khawnporn.p',   name: 'Khawnporn',     department: 'ทั่วไป',          email: 'khawnporn.p@bangkokseafood.co.th',   role: 'employee',   status: 'active' },
];

// ─── Helpers ──────────────────────────────────────────────
const d = (daysAgo: number, hoursAgo = 0) => {
  const dt = new Date('2026-05-23T09:00:00');
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(dt.getHours() - hoursAgo);
  return dt.toISOString();
};

const mkComment = (
  id: string, ticketId: string, userId: string,
  userName: string, userRole: 'employee' | 'it_staff' | 'it_manager',
  message: string, timestamp: string, isInternal = false
): Comment => ({ id, ticketId, userId, userName, userRole, message, timestamp, isInternal });

const mkTimeline = (
  id: string, ticketId: string,
  fromStatus: StatusChange['fromStatus'], toStatus: StatusChange['toStatus'],
  changedBy: string, timestamp: string
): StatusChange => ({ id, ticketId, fromStatus, toStatus, changedBy, timestamp });

// ─── Tickets ──────────────────────────────────────────────
export const mockTickets: Ticket[] = [
  {
    id: 'TKT-001',
    title: 'อินเทอร์เน็ตใช้งานไม่ได้ที่แผนกบัญชี',
    description: 'อินเทอร์เน็ตดับมาตั้งแต่เช้า 8 โมง ทำงานออนไลน์ไม่ได้เลยครับ ลองรีสตาร์ทเราเตอร์แล้วแต่ก็ยังไม่ได้ เครื่องคอมอื่นในออฟฟิศก็เป็นเหมือนกันทุกเครื่อง',
    requesterId: 'fern', requesterName: 'Fern', department: 'ทั่วไป', email: 'fern@bangkokseafood.co.th',
    category: 'internet', priority: 'high', status: 'in_progress',
    assigneeId: 'mathavee.it', assigneeName: 'Mathavee',
    slaDueTime: d(0, -4), createdAt: d(0, 4), updatedAt: d(0, 2),
    attachments: [],
    comments: [
      mkComment('c-001-1', 'TKT-001', 'fern', 'Fern', 'employee', 'ลองรีสตาร์ทเครื่องแล้วยังคงใช้งานไม่ได้ครับ ping ก็ไม่ออกเลย', d(0, 3)),
      mkComment('c-001-2', 'TKT-001', 'mathavee.it', 'Mathavee', 'it_staff', 'รับทราบค่ะ กำลังตรวจสอบ network switch ที่ชั้น 3 อยู่ค่ะ น่าจะใช้เวลาประมาณ 1-2 ชั่วโมง', d(0, 2)),
    ],
    internalNotes: [
      mkComment('n-001-1', 'TKT-001', 'mathavee.it', 'Mathavee', 'it_staff', 'ตรวจพบ switch port เสีย 3 port บน patch panel ชั้น 3 ต้องเปลี่ยน SFP module ใหม่', d(0, 2), true),
    ],
    timeline: [
      mkTimeline('tl-001-1', 'TKT-001', null, 'new', 'ระบบ', d(0, 4)),
      mkTimeline('tl-001-2', 'TKT-001', 'new', 'assigned', 'Mathavee', d(0, 3)),
      mkTimeline('tl-001-3', 'TKT-001', 'assigned', 'in_progress', 'Mathavee', d(0, 2)),
    ],
  },
  {
    id: 'TKT-002',
    title: 'ไม่สามารถเข้าสู่ระบบ ERP ได้',
    description: 'เข้าสู่ระบบ ERP ไม่ได้ตั้งแต่เมื่อวาน ระบบแจ้ง "Connection timeout" ทุกครั้งที่พยายาม login กระทบงานบัญชีที่ต้องปิดงวดบัญชีสิ้นเดือน',
    requesterId: 'acc006', requesterName: 'ACC 006', department: 'บัญชี', email: 'acc006@bangkokseafood.co.th',
    category: 'erp', priority: 'critical', status: 'assigned',
    assigneeId: 'purit.it', assigneeName: 'Purit',
    slaDueTime: d(-1, -2), createdAt: d(1, 3), updatedAt: d(1, 1),
    attachments: [],
    comments: [
      mkComment('c-002-1', 'TKT-002', 'acc006', 'ACC 006', 'employee', 'งานปิดบัญชีสิ้นเดือนกำลังจะถึงครับ ขอให้แก้ไขด่วนด้วยครับ', d(1, 2)),
      mkComment('c-002-2', 'TKT-002', 'purit.it', 'Purit', 'it_staff', 'รับทราบครับ กำลังตรวจสอบ ERP Application Server อยู่ครับ จะรีบดำเนินการให้เร็วที่สุด', d(1, 1)),
    ],
    internalNotes: [
      mkComment('n-002-1', 'TKT-002', 'purit.it', 'Purit', 'it_staff', 'ERP DB connection pool exhausted - ต้องรีสตาร์ท App Server และปรับ connection limit', d(1, 1), true),
    ],
    timeline: [
      mkTimeline('tl-002-1', 'TKT-002', null, 'new', 'ระบบ', d(1, 3)),
      mkTimeline('tl-002-2', 'TKT-002', 'new', 'assigned', 'Purit', d(1, 1)),
    ],
  },
  {
    id: 'TKT-003',
    title: 'เครื่องพิมพ์ชั้น 3 ไม่ทำงาน',
    description: 'เครื่องพิมพ์ HP LaserJet ชั้น 3 ห้อง 302 ไม่สามารถพิมพ์งานได้ มีไฟกะพริบสีส้มที่เครื่อง ลองปิดเปิดแล้วยังไม่หาย',
    requesterId: 'hr', requesterName: 'HR', department: 'ทรัพยากรบุคคล', email: 'hr@bangkokseafood.co.th',
    category: 'printer', priority: 'medium', status: 'new',
    slaDueTime: d(-1, -6), createdAt: d(1), updatedAt: d(1),
    attachments: [],
    comments: [],
    internalNotes: [],
    timeline: [mkTimeline('tl-003-1', 'TKT-003', null, 'new', 'ระบบ', d(1))],
  },
  {
    id: 'TKT-004',
    title: 'Outlook ไม่ sync อีเมลใหม่',
    description: 'อีเมลไม่ sync ตั้งแต่วันที่ 20 พ.ค. มีอีเมลค้างไม่ได้รับแน่ๆ เพราะ colleague บอกว่าส่งมาแล้วแต่ไม่ได้รับ ลอง repair Outlook แล้วยังไม่ได้',
    requesterId: 'sale', requesterName: 'Sale', department: 'ขาย', email: 'sale@bangkokseafood.co.th',
    category: 'email', priority: 'medium', status: 'resolved',
    assigneeId: 'mathavee.it', assigneeName: 'Mathavee',
    slaDueTime: d(2, -4), createdAt: d(3), updatedAt: d(2),
    attachments: [],
    comments: [
      mkComment('c-004-1', 'TKT-004', 'mathavee.it', 'Mathavee', 'it_staff', 'แก้ไขเรียบร้อยแล้วค่ะ สาเหตุเกิดจาก Outlook profile เสีย ทำการสร้าง profile ใหม่ให้แล้ว ลองตรวจสอบได้เลยค่ะ', d(2)),
      mkComment('c-004-2', 'TKT-004', 'sale', 'Sale', 'employee', 'ใช้งานได้แล้วครับ ขอบคุณมากครับ', d(2, -1)),
    ],
    internalNotes: [],
    timeline: [
      mkTimeline('tl-004-1', 'TKT-004', null, 'new', 'ระบบ', d(3)),
      mkTimeline('tl-004-2', 'TKT-004', 'new', 'assigned', 'Mathavee', d(3, -2)),
      mkTimeline('tl-004-3', 'TKT-004', 'assigned', 'in_progress', 'Mathavee', d(2, 2)),
      mkTimeline('tl-004-4', 'TKT-004', 'in_progress', 'resolved', 'Mathavee', d(2)),
    ],
  },
  {
    id: 'TKT-005',
    title: 'VPN หลุดตลอดเวลา ทำงาน Remote ไม่ได้',
    description: 'VPN หลุดทุก 10-15 นาที ใช้งาน Remote Work ไม่ได้เลย ต้อง connect ใหม่ตลอด ทำงานสำคัญที่ต้องใช้ระบบในบริษัทไม่สะดวกมาก',
    requesterId: 'imex', requesterName: 'IMEX', department: 'IMEX', email: 'imex@bangkokseafood.co.th',
    category: 'vpn', priority: 'high', status: 'in_progress',
    assigneeId: 'purit.it', assigneeName: 'Purit',
    slaDueTime: d(0, -6), createdAt: d(0, 6), updatedAt: d(0, 3),
    attachments: [],
    comments: [
      mkComment('c-005-1', 'TKT-005', 'purit.it', 'Purit', 'it_staff', 'ตรวจสอบ VPN log เรียบร้อยแล้วครับ พบว่า session timeout ตั้งค่าสั้นเกินไป กำลังปรับค่าอยู่ครับ', d(0, 3)),
    ],
    internalNotes: [
      mkComment('n-005-1', 'TKT-005', 'purit.it', 'Purit', 'it_staff', 'Fortinet VPN idle timeout = 10min ต้องปรับเป็น 60min และ keepalive interval จาก 0 เป็น 30s', d(0, 3), true),
    ],
    timeline: [
      mkTimeline('tl-005-1', 'TKT-005', null, 'new', 'ระบบ', d(0, 6)),
      mkTimeline('tl-005-2', 'TKT-005', 'new', 'assigned', 'Purit', d(0, 5)),
      mkTimeline('tl-005-3', 'TKT-005', 'assigned', 'in_progress', 'Purit', d(0, 3)),
    ],
  },
  {
    id: 'TKT-006',
    title: 'บัญชีผู้ใช้ถูกล็อค เข้าระบบไม่ได้',
    description: 'เช้านี้เข้า Windows ไม่ได้เลยครับ แจ้งว่า "Account is locked out" ไม่ได้กรอกรหัสผิดนะครับ อาจจะมีคนพยายาม login หรือเปล่า',
    requesterId: 'wh01', requesterName: 'WH 01', department: 'คลังสินค้า', email: 'wh01@bangkokseafood.co.th',
    category: 'account', priority: 'medium', status: 'waiting_user',
    assigneeId: 'mathavee.it', assigneeName: 'Mathavee',
    slaDueTime: d(0, -8), createdAt: d(0, 8), updatedAt: d(0, 5),
    attachments: [],
    comments: [
      mkComment('c-006-1', 'TKT-006', 'mathavee.it', 'Mathavee', 'it_staff', 'ได้ unlock บัญชีให้แล้วค่ะ และ reset รหัสผ่านชั่วคราวให้แล้ว กรุณา login ด้วยรหัสผ่านชั่วคราว: IT@Temp2026 แล้วเปลี่ยนรหัสใหม่ทันทีนะคะ', d(0, 5)),
      mkComment('c-006-2', 'TKT-006', 'wh01', 'WH 01', 'employee', 'ขอบคุณครับ กำลังรอ IT unlock ให้', d(0, 7)),
    ],
    internalNotes: [],
    timeline: [
      mkTimeline('tl-006-1', 'TKT-006', null, 'new', 'ระบบ', d(0, 8)),
      mkTimeline('tl-006-2', 'TKT-006', 'new', 'assigned', 'Mathavee', d(0, 7)),
      mkTimeline('tl-006-3', 'TKT-006', 'assigned', 'waiting_user', 'Mathavee', d(0, 5)),
    ],
  },
  {
    id: 'TKT-007',
    title: 'ขอติดตั้งโปรแกรม Adobe Acrobat',
    description: 'ต้องการใช้ Adobe Acrobat Pro สำหรับแก้ไข PDF เอกสารสัญญา ปัจจุบันมีแค่ Reader ไม่สามารถแก้ไขหรือ sign เอกสารได้',
    requesterId: 'hr', requesterName: 'HR', department: 'ทรัพยากรบุคคล', email: 'hr@bangkokseafood.co.th',
    category: 'software', priority: 'low', status: 'new',
    slaDueTime: d(-3), createdAt: d(2), updatedAt: d(2),
    attachments: [],
    comments: [],
    internalNotes: [],
    timeline: [mkTimeline('tl-007-1', 'TKT-007', null, 'new', 'ระบบ', d(2))],
  },
  {
    id: 'TKT-008',
    title: 'อีเมล Phishing น่าสงสัย - Security Alert',
    description: 'ได้รับอีเมลจาก noreply@microsoft-support.net แจ้งให้ยืนยัน account Microsoft 365 ด่วน มี link แนบมาด้วย ไม่ได้คลิกนะครับ แต่อยากให้ IT ตรวจสอบด้วย',
    requesterId: 'fern', requesterName: 'Fern', department: 'ทั่วไป', email: 'fern@bangkokseafood.co.th',
    category: 'security', priority: 'critical', status: 'assigned',
    assigneeId: 'admin', assigneeName: 'Admin',
    slaDueTime: d(0, -1), createdAt: d(0, 5), updatedAt: d(0, 4),
    attachments: [],
    comments: [
      mkComment('c-008-1', 'TKT-008', 'admin', 'Admin', 'it_manager', 'รับทราบค่ะ ห้ามคลิก link ใดๆ ในอีเมลนั้นเด็ดขาดนะคะ กำลังวิเคราะห์ email header อยู่ค่ะ', d(0, 4)),
    ],
    internalNotes: [
      mkComment('n-008-1', 'TKT-008', 'admin', 'Admin', 'it_manager', 'Domain spoofing ชัดเจน - ต้อง block domain นี้ใน mail gateway และแจ้งเตือนพนักงานทั้งหมด', d(0, 4), true),
    ],
    timeline: [
      mkTimeline('tl-008-1', 'TKT-008', null, 'new', 'ระบบ', d(0, 5)),
      mkTimeline('tl-008-2', 'TKT-008', 'new', 'assigned', 'Admin', d(0, 4)),
    ],
  },
  {
    id: 'TKT-009',
    title: 'คอมพิวเตอร์ทำงานช้ามากจนทำงานไม่ได้',
    description: 'คอมช้ามาก เปิด Excel ก็ใช้เวลา 5 นาที ทั้งๆ ที่ไฟล์ไม่ใหญ่ Windows เริ่มต้นก็ช้า Task Manager ดูแล้ว CPU 100% ตลอดเวลา',
    requesterId: 'acc006', requesterName: 'ACC 006', department: 'บัญชี', email: 'acc006@bangkokseafood.co.th',
    category: 'computer', priority: 'low', status: 'in_progress',
    assigneeId: 'mathavee.it', assigneeName: 'Mathavee',
    slaDueTime: d(1), createdAt: d(4), updatedAt: d(3),
    attachments: [],
    comments: [
      mkComment('c-009-1', 'TKT-009', 'mathavee.it', 'Mathavee', 'it_staff', 'ตรวจสอบเรียบร้อยค่ะ พบ Malware และ Startup program หลายตัวที่ทำให้ระบบช้า กำลังทำ cleanup และ optimize อยู่ค่ะ', d(3)),
    ],
    internalNotes: [],
    timeline: [
      mkTimeline('tl-009-1', 'TKT-009', null, 'new', 'ระบบ', d(4)),
      mkTimeline('tl-009-2', 'TKT-009', 'new', 'assigned', 'Mathavee', d(4, -2)),
      mkTimeline('tl-009-3', 'TKT-009', 'assigned', 'in_progress', 'Mathavee', d(3)),
    ],
  },
  {
    id: 'TKT-010',
    title: 'Microsoft Teams โทรออกไม่ได้',
    description: 'ใช้ Teams โทรหาลูกค้าภายนอกไม่ได้เลย ขึ้น error "Call failed" แต่รับสายได้ปกติ',
    requesterId: 'sale', requesterName: 'Sale', department: 'ขาย', email: 'sale@bangkokseafood.co.th',
    category: 'software', priority: 'medium', status: 'closed',
    assigneeId: 'purit.it', assigneeName: 'Purit',
    slaDueTime: d(4), createdAt: d(6), updatedAt: d(5),
    attachments: [],
    comments: [
      mkComment('c-010-1', 'TKT-010', 'purit.it', 'Purit', 'it_staff', 'แก้ไขเรียบร้อยครับ เป็นปัญหา Teams Calling Plan license หมดอายุ ต่ออายุใหม่แล้วครับ', d(5)),
      mkComment('c-010-2', 'TKT-010', 'sale', 'Sale', 'employee', 'โทรได้แล้วครับ ขอบคุณมากครับ', d(5, -1)),
    ],
    internalNotes: [],
    timeline: [
      mkTimeline('tl-010-1', 'TKT-010', null, 'new', 'ระบบ', d(6)),
      mkTimeline('tl-010-2', 'TKT-010', 'new', 'assigned', 'Purit', d(6, -1)),
      mkTimeline('tl-010-3', 'TKT-010', 'assigned', 'in_progress', 'Purit', d(5, 2)),
      mkTimeline('tl-010-4', 'TKT-010', 'in_progress', 'resolved', 'Purit', d(5)),
      mkTimeline('tl-010-5', 'TKT-010', 'resolved', 'closed', 'Mathavee', d(4)),
    ],
  },
  {
    id: 'TKT-011',
    title: 'ลืมรหัสผ่าน Windows',
    description: 'ลืมรหัสผ่านเข้า Windows หลังจากกลับมาจากลาพัก 2 สัปดาห์',
    requesterId: 'imex', requesterName: 'IMEX', department: 'IMEX', email: 'imex@bangkokseafood.co.th',
    category: 'account', priority: 'low', status: 'closed',
    assigneeId: 'mathavee.it', assigneeName: 'Mathavee',
    slaDueTime: d(7), createdAt: d(10), updatedAt: d(10),
    attachments: [],
    comments: [mkComment('c-011-1', 'TKT-011', 'mathavee.it', 'Mathavee', 'it_staff', 'Reset รหัสผ่านให้แล้วค่ะ กรุณาเปลี่ยนรหัสหลัง login ครั้งแรกด้วยนะคะ', d(10))],
    internalNotes: [],
    timeline: [
      mkTimeline('tl-011-1', 'TKT-011', null, 'new', 'ระบบ', d(10)),
      mkTimeline('tl-011-2', 'TKT-011', 'new', 'resolved', 'Mathavee', d(10)),
      mkTimeline('tl-011-3', 'TKT-011', 'resolved', 'closed', 'Mathavee', d(9)),
    ],
  },
  {
    id: 'TKT-012',
    title: 'เข้า Network Drive ไม่ได้ - \\\\fileserver\\shared',
    description: 'เข้า shared drive \\\\fileserver\\shared ไม่ได้ตั้งแต่เมื่อวาน แจ้งว่า "Network path not found" ต้องใช้ไฟล์สำคัญที่อยู่ใน drive นี้',
    requesterId: 'wh01', requesterName: 'WH 01', department: 'คลังสินค้า', email: 'wh01@bangkokseafood.co.th',
    category: 'other', priority: 'high', status: 'assigned',
    assigneeId: 'purit.it', assigneeName: 'Purit',
    slaDueTime: d(-1, -3), createdAt: d(1, 5), updatedAt: d(1, 2),
    attachments: [],
    comments: [
      mkComment('c-012-1', 'TKT-012', 'purit.it', 'Purit', 'it_staff', 'กำลังตรวจสอบ File Server อยู่ครับ', d(1, 2)),
    ],
    internalNotes: [
      mkComment('n-012-1', 'TKT-012', 'purit.it', 'Purit', 'it_staff', 'File Server disk full 98% ต้อง archive ข้อมูลเก่าด่วน', d(1, 2), true),
    ],
    timeline: [
      mkTimeline('tl-012-1', 'TKT-012', null, 'new', 'ระบบ', d(1, 5)),
      mkTimeline('tl-012-2', 'TKT-012', 'new', 'assigned', 'Purit', d(1, 2)),
    ],
  },
  {
    id: 'TKT-013',
    title: 'Report ERP แสดงข้อมูลไม่ถูกต้อง',
    description: 'Report ยอดขายรายเดือนใน ERP แสดงตัวเลขไม่ตรงกับ Excel ที่คีย์เอง ต่างกันหลายแสนบาท ต้องนำเสนอผู้บริหารพรุ่งนี้',
    requesterId: 'sale', requesterName: 'Sale', department: 'ขาย', email: 'sale@bangkokseafood.co.th',
    category: 'erp', priority: 'high', status: 'in_progress',
    assigneeId: 'admin', assigneeName: 'Admin',
    slaDueTime: d(-1), createdAt: d(2), updatedAt: d(1),
    attachments: [],
    comments: [
      mkComment('c-013-1', 'TKT-013', 'admin', 'Admin', 'it_manager', 'กำลังตรวจสอบ query ใน ERP database อยู่ค่ะ น่าจะเป็น data sync issue', d(1)),
    ],
    internalNotes: [],
    timeline: [
      mkTimeline('tl-013-1', 'TKT-013', null, 'new', 'ระบบ', d(2)),
      mkTimeline('tl-013-2', 'TKT-013', 'new', 'assigned', 'Admin', d(2, -2)),
      mkTimeline('tl-013-3', 'TKT-013', 'assigned', 'in_progress', 'Admin', d(1)),
    ],
  },
  {
    id: 'TKT-014',
    title: 'จอ Monitor มีเส้นสีขาวแนวตั้ง',
    description: 'จอมอนิเตอร์มีเส้นสีขาวแนวตั้ง 3 เส้น ตั้งแต่เมื่อเช้า ลองเปลี่ยน resolution แล้วยังเป็นอยู่',
    requesterId: 'hr', requesterName: 'HR', department: 'ทรัพยากรบุคคล', email: 'hr@bangkokseafood.co.th',
    category: 'computer', priority: 'medium', status: 'new',
    slaDueTime: d(-2), createdAt: d(1, 1), updatedAt: d(1, 1),
    attachments: [],
    comments: [],
    internalNotes: [],
    timeline: [mkTimeline('tl-014-1', 'TKT-014', null, 'new', 'ระบบ', d(1, 1))],
  },
  {
    id: 'TKT-015',
    title: 'Wi-Fi ห้องประชุม A หลุดบ่อย',
    description: 'Wi-Fi ห้องประชุม A ชั้น 5 หลุดทุก 20-30 นาที ทำให้ Video Conference กับลูกค้าต่างประเทศสะดุดบ่อย กระทบการประชุมสำคัญ',
    requesterId: 'imex', requesterName: 'IMEX', department: 'IMEX', email: 'imex@bangkokseafood.co.th',
    category: 'internet', priority: 'medium', status: 'new',
    slaDueTime: d(-1, -5), createdAt: d(2), updatedAt: d(2),
    attachments: [],
    comments: [],
    internalNotes: [],
    timeline: [mkTimeline('tl-015-1', 'TKT-015', null, 'new', 'ระบบ', d(2))],
  },
  {
    id: 'TKT-016',
    title: 'ส่งอีเมลออกไม่ได้ - Domain ถูก Block',
    description: 'ส่งอีเมลออกไปที่ partner@thaimail.com ไม่ได้ ระบบแจ้ง "550 5.7.1 Message rejected as spam" ต้องส่งสัญญาให้ลูกค้าวันนี้',
    requesterId: 'payroll', requesterName: 'Payroll', department: 'เงินเดือน', email: 'payroll@bangkokseafood.co.th',
    category: 'email', priority: 'high', status: 'waiting_user',
    assigneeId: 'mathavee.it', assigneeName: 'Mathavee',
    slaDueTime: d(-1, -4), createdAt: d(2), updatedAt: d(1),
    attachments: [],
    comments: [
      mkComment('c-016-1', 'TKT-016', 'mathavee.it', 'Mathavee', 'it_staff', 'ตรวจสอบแล้วพบว่า IP ของเราถูกเพิ่มใน RBL blacklist กำลังดำเนินการ delist อยู่ค่ะ อาจใช้เวลา 24-48 ชั่วโมง ระหว่างนี้ลองใช้ Gmail ส่งก่อนได้ค่ะ', d(1)),
    ],
    internalNotes: [],
    timeline: [
      mkTimeline('tl-016-1', 'TKT-016', null, 'new', 'ระบบ', d(2)),
      mkTimeline('tl-016-2', 'TKT-016', 'new', 'assigned', 'Mathavee', d(2, -1)),
      mkTimeline('tl-016-3', 'TKT-016', 'assigned', 'waiting_user', 'Mathavee', d(1)),
    ],
  },
  {
    id: 'TKT-017',
    title: 'Windows Update ติดตั้งไม่ได้ - Error 0x800705B4',
    description: 'Windows Update ค้างที่ 35% และ error 0x800705B4 ทุกครั้ง ลอง reset Windows Update Components แล้วยังไม่ได้',
    requesterId: 'wh01', requesterName: 'WH 01', department: 'คลังสินค้า', email: 'wh01@bangkokseafood.co.th',
    category: 'computer', priority: 'medium', status: 'in_progress',
    assigneeId: 'purit.it', assigneeName: 'Purit',
    slaDueTime: d(2), createdAt: d(5), updatedAt: d(4),
    attachments: [],
    comments: [
      mkComment('c-017-1', 'TKT-017', 'purit.it', 'Purit', 'it_staff', 'กำลัง run Windows Update Troubleshooter และ SFC /scannow อยู่ครับ', d(4)),
    ],
    internalNotes: [],
    timeline: [
      mkTimeline('tl-017-1', 'TKT-017', null, 'new', 'ระบบ', d(5)),
      mkTimeline('tl-017-2', 'TKT-017', 'new', 'assigned', 'Purit', d(5, -1)),
      mkTimeline('tl-017-3', 'TKT-017', 'assigned', 'in_progress', 'Purit', d(4)),
    ],
  },
  {
    id: 'TKT-018',
    title: 'ขอติดตั้งเครื่องพิมพ์ใหม่ HP ชั้น 2',
    description: 'ต้องการติดตั้งเครื่องพิมพ์ HP LaserJet Pro เครื่องใหม่ที่ซื้อมา ติดตั้ง driver เองไม่ได้',
    requesterId: 'acc006', requesterName: 'ACC 006', department: 'บัญชี', email: 'acc006@bangkokseafood.co.th',
    category: 'printer', priority: 'low', status: 'resolved',
    assigneeId: 'mathavee.it', assigneeName: 'Mathavee',
    slaDueTime: d(5), createdAt: d(8), updatedAt: d(7),
    attachments: [],
    comments: [mkComment('c-018-1', 'TKT-018', 'mathavee.it', 'Mathavee', 'it_staff', 'ติดตั้งเรียบร้อยแล้วค่ะ ทดสอบพิมพ์แล้วใช้งานได้ปกติค่ะ', d(7))],
    internalNotes: [],
    timeline: [
      mkTimeline('tl-018-1', 'TKT-018', null, 'new', 'ระบบ', d(8)),
      mkTimeline('tl-018-2', 'TKT-018', 'new', 'assigned', 'Mathavee', d(8, -1)),
      mkTimeline('tl-018-3', 'TKT-018', 'assigned', 'in_progress', 'Mathavee', d(7, 2)),
      mkTimeline('tl-018-4', 'TKT-018', 'in_progress', 'resolved', 'Mathavee', d(7)),
    ],
  },
  {
    id: 'TKT-019',
    title: 'ขอสิทธิ์เข้าถึง Folder HR Confidential',
    description: 'ต้องการสิทธิ์ read-only เข้า folder \\\\fileserver\\HR\\Confidential สำหรับงาน audit ภายใน ได้รับอนุมัติจาก HR Manager แล้ว',
    requesterId: 'hr', requesterName: 'HR', department: 'ทรัพยากรบุคคล', email: 'hr@bangkokseafood.co.th',
    category: 'account', priority: 'medium', status: 'new',
    slaDueTime: d(-1), createdAt: d(1, 2), updatedAt: d(1, 2),
    attachments: [],
    comments: [],
    internalNotes: [],
    timeline: [mkTimeline('tl-019-1', 'TKT-019', null, 'new', 'ระบบ', d(1, 2))],
  },
  {
    id: 'TKT-020',
    title: 'Server หลักดับกระทบทุกแผนก - CRITICAL',
    description: 'Server ห้อง Data Center ดับกะทันหัน ระบบภายในทุกระบบใช้งานไม่ได้ ทั้ง ERP, File Server, Print Server ไม่มีไฟ LED กะพริบ อาจเป็น power supply',
    requesterId: 'wh01', requesterName: 'WH 01', department: 'คลังสินค้า', email: 'wh01@bangkokseafood.co.th',
    category: 'other', priority: 'critical', status: 'reopened',
    assigneeId: 'admin', assigneeName: 'Admin',
    slaDueTime: d(-1, -6), createdAt: d(3, 6), updatedAt: d(0, 2),
    attachments: [],
    comments: [
      mkComment('c-020-1', 'TKT-020', 'admin', 'Admin', 'it_manager', 'ทีม IT กำลังดำเนินการแก้ไขอยู่ค่ะ อาจต้องประสาน vendor มาเปลี่ยน PSU ค่ะ', d(3, 5)),
      mkComment('c-020-2', 'TKT-020', 'wh01', 'WH 01', 'employee', 'ระบบกลับมาใช้งานได้แล้วแต่ยังมีบางส่วนช้ากว่าปกติ', d(2, 2)),
      mkComment('c-020-3', 'TKT-020', 'wh01', 'WH 01', 'employee', 'ระบบดับอีกครั้งแล้วครับ เหมือน PSU ยังมีปัญหาอยู่', d(0, 2)),
    ],
    internalNotes: [
      mkComment('n-020-1', 'TKT-020', 'admin', 'Admin', 'it_manager', 'PSU ตัวสำรองก็เสียด้วย ต้องสั่ง PSU ใหม่จาก vendor ETA 2-3 วัน', d(0, 2), true),
    ],
    timeline: [
      mkTimeline('tl-020-1', 'TKT-020', null, 'new', 'ระบบ', d(3, 6)),
      mkTimeline('tl-020-2', 'TKT-020', 'new', 'assigned', 'Admin', d(3, 5)),
      mkTimeline('tl-020-3', 'TKT-020', 'assigned', 'in_progress', 'Admin', d(3, 4)),
      mkTimeline('tl-020-4', 'TKT-020', 'in_progress', 'resolved', 'Admin', d(2, 1)),
      mkTimeline('tl-020-5', 'TKT-020', 'resolved', 'reopened', 'WH 01', d(0, 2)),
    ],
  },
];

// ─── Services ─────────────────────────────────────────────
export const mockServices: Service[] = [
  { id: 'svc-1', name: 'อินเทอร์เน็ต', nameEn: 'Internet', status: 'degraded', lastChecked: d(0), uptimePercent: 94.2, description: 'การเชื่อมต่ออินเทอร์เน็ตหลัก ISP 1 Gbps' },
  { id: 'svc-2', name: 'Email Server', nameEn: 'Email Server', status: 'operational', lastChecked: d(0), uptimePercent: 99.8, description: 'Microsoft Exchange On-Premises' },
  { id: 'svc-3', name: 'VPN', nameEn: 'VPN', status: 'operational', lastChecked: d(0), uptimePercent: 99.1, description: 'Fortinet SSL VPN Gateway' },
  { id: 'svc-4', name: 'ระบบ ERP', nameEn: 'ERP System', status: 'partial_outage', lastChecked: d(0), uptimePercent: 87.5, description: 'SAP Business One Application Server' },
  { id: 'svc-5', name: 'File Server', nameEn: 'File Server', status: 'operational', lastChecked: d(0), uptimePercent: 99.5, description: 'Windows File Server - Shared Drives' },
  { id: 'svc-6', name: 'Print Server', nameEn: 'Print Server', status: 'operational', lastChecked: d(0), uptimePercent: 98.7, description: 'Print Server ควบคุมเครื่องพิมพ์ทั้งอาคาร' },
  { id: 'svc-7', name: 'Wi-Fi', nameEn: 'Wi-Fi', status: 'operational', lastChecked: d(0), uptimePercent: 97.3, description: 'Wireless Network ทั้งอาคาร' },
  { id: 'svc-8', name: 'ระบบ HR', nameEn: 'HR System', status: 'maintenance', lastChecked: d(0), uptimePercent: 99.0, description: 'ระบบทรัพยากรบุคคล HRi Cloud' },
];

// ─── Incidents ────────────────────────────────────────────
export const mockIncidents: Incident[] = [
  {
    id: 'INC-001',
    title: 'ระบบ ERP ตอบสนองช้าและ Login ไม่ได้บางผู้ใช้',
    description: 'พบปัญหา ERP Application Server มี connection pool exhausted ทำให้ผู้ใช้บางส่วน login ไม่ได้หรือระบบตอบสนองช้ากว่าปกติมาก',
    affectedServices: ['svc-4'],
    status: 'identified',
    severity: 'high',
    createdAt: d(1, 3),
    updatedAt: d(1),
    createdBy: 'Admin',
  },
  {
    id: 'INC-002',
    title: 'อินเทอร์เน็ตความเร็วต่ำกว่าปกติ - ISP Issue',
    description: 'ความเร็วอินเทอร์เน็ตลดลงเหลือประมาณ 30% ของปกติ ได้ประสาน ISP แล้ว กำลังตรวจสอบ routing issue',
    affectedServices: ['svc-1'],
    status: 'monitoring',
    severity: 'medium',
    createdAt: d(0, 5),
    updatedAt: d(0, 2),
    createdBy: 'Purit',
  },
  {
    id: 'INC-003',
    title: 'ระบบ Server หลักดับ - แก้ไขแล้ว',
    description: 'Primary Server PSU เสียทำให้ระบบดับกะทันหัน ได้ switch ไปใช้ Secondary Server แล้ว กำลังรอ PSU ชิ้นใหม่จาก vendor',
    affectedServices: ['svc-4', 'svc-5', 'svc-6'],
    status: 'monitoring',
    severity: 'critical',
    createdAt: d(3, 6),
    updatedAt: d(0, 2),
    createdBy: 'Admin',
  },
];

// ─── Maintenance ──────────────────────────────────────────
export const mockMaintenances: Maintenance[] = [
  {
    id: 'MNT-001',
    title: 'บำรุงรักษา ระบบ HR ประจำเดือน',
    description: 'อัพเดต HRi Cloud เป็น version ใหม่และ database maintenance รายเดือน',
    affectedServices: ['svc-8'],
    scheduledStart: '2026-05-23T22:00:00',
    scheduledEnd: '2026-05-24T02:00:00',
    status: 'in_progress',
  },
  {
    id: 'MNT-002',
    title: 'อัพเดต Firmware Network Switches ทุกชั้น',
    description: 'อัพเดต firmware network switch ทุกชั้นเพื่อแก้ช่องโหว่ความปลอดภัย CVE-2026-1234',
    affectedServices: ['svc-1', 'svc-7'],
    scheduledStart: '2026-05-25T01:00:00',
    scheduledEnd: '2026-05-25T05:00:00',
    status: 'scheduled',
  },
  {
    id: 'MNT-003',
    title: 'ย้าย ERP Database ไปยัง Server ใหม่',
    description: 'migrate ERP database จาก Primary Server เก่าไปยัง Server ใหม่ที่มี SSD NVMe',
    affectedServices: ['svc-4'],
    scheduledStart: '2026-05-31T20:00:00',
    scheduledEnd: '2026-06-01T06:00:00',
    status: 'scheduled',
  },
];

// ─── Knowledge Base ───────────────────────────────────────
export const mockKBArticles: KBArticle[] = [
  {
    id: 'KB-001',
    title: 'วิธีแก้ไขปัญหา Wi-Fi ไม่เชื่อมต่อหรือสัญญาณอ่อน',
    category: 'อินเทอร์เน็ต',
    summary: 'ขั้นตอนการแก้ไขปัญหา Wi-Fi ไม่เชื่อมต่อ สัญญาณอ่อน หรือ internet ช้า ด้วยตัวเองก่อนติดต่อ IT',
    content: `## วิธีแก้ไขปัญหา Wi-Fi\n\n### ขั้นตอนเบื้องต้น\n1. ตรวจสอบว่า Wi-Fi เปิดอยู่ที่เครื่อง (กด Fn+F2 หรือ Windows+A)\n2. ลอง Disconnect แล้ว Connect ใหม่\n3. Restart เครื่องคอมพิวเตอร์\n4. ลืม Network แล้ว Connect ใหม่\n\n### ถ้ายังไม่ได้\n- เปิด Command Prompt พิมพ์: ipconfig /flushdns\n- รัน: netsh winsock reset\n- Restart เครื่องอีกครั้ง\n\n### ติดต่อ IT เมื่อ\n- ทำตามขั้นตอนแล้วยังไม่ได้\n- มีคนอื่นในพื้นที่เดียวกันมีปัญหาด้วย`,
    tags: ['wifi', 'internet', 'network', 'connection'],
    views: 1284, helpful: 98,
    createdAt: d(90), updatedAt: d(5), author: 'Purit',
  },
  {
    id: 'KB-002',
    title: 'การตั้งค่า Email บน Outlook และแก้ไขปัญหาพื้นฐาน',
    category: 'อีเมล',
    summary: 'วิธีตั้งค่า Outlook ใหม่, แก้ปัญหา email ไม่ sync, รหัสผ่านหมดอายุ',
    content: `## การตั้งค่า Outlook\n\n### ตั้งค่าครั้งแรก\n1. เปิด Outlook > File > Add Account\n2. ใส่ Email: username@bangkokseafood.co.th\n3. ใส่รหัสผ่าน Windows ของท่าน\n4. รอระบบตั้งค่าอัตโนมัติ\n\n### Email ไม่ sync\n1. File > Account Settings > Account Settings\n2. เลือก account แล้วกด Repair\n3. ถ้าไม่ได้ ลบ account และสร้างใหม่\n\n### รหัสผ่านหมดอายุ\n- กด Ctrl+Alt+Del > Change Password\n- หรือ ไปที่ myaccount.microsoft.com`,
    tags: ['email', 'outlook', 'office365', 'mail'],
    views: 956, helpful: 87,
    createdAt: d(60), updatedAt: d(10), author: 'Mathavee',
  },
  {
    id: 'KB-003',
    title: 'วิธีรีเซ็ตรหัสผ่าน Windows และ Office 365',
    category: 'บัญชีผู้ใช้',
    summary: 'ขั้นตอนรีเซ็ตรหัสผ่านด้วยตัวเอง หรือผ่าน IT Helpdesk',
    content: `## รีเซ็ตรหัสผ่าน\n\n### รีเซ็ตรหัสผ่านด้วยตัวเอง (ผ่าน Self-Service)\n1. ไปที่ https://passwordreset.bangkokseafood.co.th\n2. ใส่ username\n3. ยืนยันตัวตนผ่านมือถือ\n4. ตั้งรหัสผ่านใหม่\n\n### กฎรหัสผ่านบริษัท\n- ความยาวอย่างน้อย 12 ตัวอักษร\n- ต้องมีตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, ตัวเลข, อักขระพิเศษ\n- ห้ามซ้ำกับรหัสผ่าน 10 ครั้งที่แล้ว\n- เปลี่ยนทุก 90 วัน\n\n### ติดต่อ IT\n- โทร ext. 1001 หรือแจ้ง ticket ผ่านระบบ`,
    tags: ['password', 'reset', 'account', 'login'],
    views: 2103, helpful: 145,
    createdAt: d(120), updatedAt: d(15), author: 'Admin',
  },
  {
    id: 'KB-004',
    title: 'การติดตั้งและแก้ไขปัญหา VPN FortiClient',
    category: 'VPN',
    summary: 'วิธีติดตั้ง FortiClient VPN สำหรับ Remote Work และแก้ปัญหาการเชื่อมต่อ',
    content: `## VPN Setup Guide\n\n### ติดตั้ง FortiClient\n1. ดาวน์โหลด FortiClient จาก \\\\fileserver\\IT\\Software\\VPN\\\n2. ติดตั้งตามขั้นตอน\n3. เปิด FortiClient > Remote Access\n4. กด Configure VPN:\n   - VPN Type: SSL-VPN\n   - Remote GW: vpn.bangkokseafood.co.th\n   - Username: ชื่อ domain ของท่าน\n\n### VPN ใช้งานไม่ได้\n1. ตรวจสอบ internet ว่าใช้งานได้ปกติก่อน\n2. ปิด-เปิด FortiClient ใหม่\n3. ตรวจสอบ Firewall Windows ไม่ block FortiClient\n4. ถ้ายังไม่ได้ ส่ง ticket แนบ log จาก FortiClient`,
    tags: ['vpn', 'forticlient', 'remote', 'work from home'],
    views: 743, helpful: 71,
    createdAt: d(45), updatedAt: d(20), author: 'Purit',
  },
  {
    id: 'KB-005',
    title: 'วิธีเพิ่มและแก้ไขปัญหาเครื่องพิมพ์',
    category: 'เครื่องพิมพ์',
    summary: 'วิธีเพิ่มเครื่องพิมพ์ผ่าน network, แก้กระดาษติด, และปัญหาทั่วไป',
    content: `## การเพิ่มเครื่องพิมพ์\n\n### เพิ่ม Network Printer\n1. Control Panel > Devices and Printers > Add a Printer\n2. เลือก "Add a network, wireless or Bluetooth printer"\n3. หรือพิมพ์ printer address โดยตรง: \\\\printserver\\ชื่อ_printer\n\n### ชื่อ Printer ในระบบ\n- ชั้น 1: HPLJ-FL1-001, HPLJ-FL1-002\n- ชั้น 2: HPLJ-FL2-001, HPLJ-FL2-002\n- ชั้น 3: HPLJ-FL3-001\n- ชั้น 5 (ห้องประชุม): RICOH-CONF-A, RICOH-CONF-B\n\n### กระดาษติด\n1. เปิดฝาด้านหน้าและด้านหลัง\n2. ดึงกระดาษออกอย่างระมัดระวัง\n3. ตรวจสอบชิ้นส่วนกระดาษค้างอยู่ในเครื่อง`,
    tags: ['printer', 'print', 'paper jam', 'network printer'],
    views: 612, helpful: 54,
    createdAt: d(70), updatedAt: d(30), author: 'Mathavee',
  },
  {
    id: 'KB-006',
    title: 'แก้ปัญหา Microsoft 365 ทั่วไป (Teams, OneDrive, Office)',
    category: 'ซอฟต์แวร์',
    summary: 'คู่มือแก้ปัญหา Microsoft 365 Apps พื้นฐาน ก่อนติดต่อ IT',
    content: `## Microsoft 365 Troubleshooting\n\n### License หมดอายุ\n- เข้า portal.office.com ตรวจสอบสถานะ license\n- ติดต่อ IT เพื่อต่ออายุ\n\n### Teams ไม่สามารถเข้าร่วม Meeting\n1. อัพเดต Teams เป็น version ล่าสุด\n2. Clear cache: %AppData%\\Microsoft\\Teams\\Cache\n3. Sign out แล้ว Sign in ใหม่\n\n### OneDrive sync ไม่ทำงาน\n1. คลิกขวา OneDrive icon ใน System Tray\n2. Pause syncing 2 ชั่วโมง แล้ว Resume\n3. ถ้ายังไม่ได้ Reset: %localappdata%\\Microsoft\\OneDrive\\onedrive.exe /reset`,
    tags: ['microsoft365', 'teams', 'onedrive', 'office', 'outlook'],
    views: 891, helpful: 76,
    createdAt: d(55), updatedAt: d(8), author: 'Purit',
  },
  {
    id: 'KB-007',
    title: 'บัญชีถูกล็อค (Account Lockout) - วิธีปลดล็อคและป้องกัน',
    category: 'บัญชีผู้ใช้',
    summary: 'สาเหตุที่บัญชีถูกล็อคและวิธีป้องกัน พร้อมขั้นตอนขอปลดล็อคผ่าน IT',
    content: `## Account Lockout\n\n### สาเหตุที่บัญชีถูกล็อค\n- กรอกรหัสผ่านผิดเกิน 5 ครั้ง\n- รหัสผ่านที่บันทึกในอุปกรณ์อื่นหมดอายุแต่ยังพยายาม login\n- Mapped drive หรือ Scheduled task ใช้รหัสผ่านเก่า\n\n### วิธีปลดล็อค\n1. ติดต่อ IT Helpdesk ด่วนผ่านระบบ ticket\n2. แจ้ง: ชื่อ, แผนก, เวลาที่ถูกล็อค\n3. IT จะ unlock และ reset รหัสผ่านชั่วคราว\n\n### การป้องกัน\n- จำรหัสผ่านหรือใช้ Password Manager\n- อัพเดตรหัสผ่านที่บันทึกในอุปกรณ์ทุกเครื่องเมื่อเปลี่ยน`,
    tags: ['account', 'locked', 'password', 'security'],
    views: 534, helpful: 48,
    createdAt: d(80), updatedAt: d(12), author: 'Admin',
  },
  {
    id: 'KB-008',
    title: 'แนวทางปฏิบัติด้านความปลอดภัยข้อมูล (Security Best Practices)',
    category: 'ความปลอดภัย',
    summary: 'มาตรการความปลอดภัยที่พนักงานทุกคนต้องปฏิบัติตาม',
    content: `## Security Best Practices\n\n### อีเมล Phishing\n- ห้ามคลิก link หรือ attachment ใน email ที่น่าสงสัย\n- ตรวจสอบ email address ผู้ส่งให้ละเอียด\n- ถ้าสงสัย Forward ให้ admin@bangkokseafood.co.th\n\n### รหัสผ่าน\n- ห้ามบอกรหัสผ่านใครทั้งนั้น รวมถึง IT\n- ห้ามใช้รหัสผ่านเดียวกันหลายระบบ\n- เปิดใช้ MFA ในทุก account ที่รองรับ\n\n### USB และอุปกรณ์ภายนอก\n- ห้ามเสียบ USB ที่ไม่รู้จักต้นทาง\n- ขอให้ IT scan ก่อนใช้งาน\n\n### Lock Screen\n- กด Windows+L ทุกครั้งที่ออกจากโต๊ะ`,
    tags: ['security', 'phishing', 'password', 'usb', 'best practice'],
    views: 445, helpful: 42,
    createdAt: d(100), updatedAt: d(25), author: 'Admin',
  },
];
