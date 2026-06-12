import { useState, useRef } from 'react';
import { CheckCircle2, Upload, X, Send, FileText, Wifi, Printer, Mail, KeyRound, Monitor, HelpCircle, Camera } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import * as TicketsAPI from '../../api/tickets';
import type { TicketCategory, TicketPriority } from '../../types';

interface FormData {
  title: string;
  description: string;
  requesterName: string;
  department: string;
  // hidden defaults — set by template or fallback
  category: TicketCategory;
  priority: TicketPriority;
}

const ACCEPTED = '.png,.jpg,.jpeg,.gif,.pdf,.txt,.xlsx,.xls,.docx,.doc,.zip,.log';

type Template = {
  label: string;
  icon: React.ReactNode;
  color: string;
  category: TicketCategory;
  priority: TicketPriority;
  title: string;
  description: string;
};

const TEMPLATES: Template[] = [
  {
    label: 'อินเทอร์เน็ต / Wi-Fi', icon: <Wifi size={16} />, color: '#06b6d4',
    category: 'internet', priority: 'high',
    title: 'อินเทอร์เน็ต / Wi-Fi ใช้งานไม่ได้',
    description: 'อินเทอร์เน็ตหรือ Wi-Fi ใช้งานไม่ได้\n\nรายละเอียดเพิ่มเติม:\n- สถานที่: \n- เครื่องที่มีปัญหา: \n- เกิดตั้งแต่เมื่อไหร่: \n- ลองแก้ไขอะไรไปแล้ว: ',
  },
  {
    label: 'เครื่องพิมพ์', icon: <Printer size={16} />, color: '#f59e0b',
    category: 'printer', priority: 'medium',
    title: 'เครื่องพิมพ์ใช้งานไม่ได้',
    description: 'เครื่องพิมพ์ไม่สามารถใช้งานได้\n\nรายละเอียด:\n- ชื่อ/รุ่นเครื่องพิมพ์: \n- อาการที่พบ (เช่น ไม่พิมพ์, กระดาษติด, ขึ้น error): \n- ห้อง/ชั้น: ',
  },
  {
    label: 'อีเมล / Outlook', icon: <Mail size={16} />, color: '#6366f1',
    category: 'email', priority: 'medium',
    title: 'อีเมล / Outlook มีปัญหา',
    description: 'มีปัญหาเกี่ยวกับอีเมลหรือ Outlook\n\nอาการที่พบ (เลือกที่ตรงกัน):\n- [ ] ส่งอีเมลไม่ได้\n- [ ] รับอีเมลไม่ได้\n- [ ] Outlook ไม่ sync\n- [ ] เข้า Outlook ไม่ได้\n\nรายละเอียดเพิ่มเติม: ',
  },
  {
    label: 'ลืม / ถูกล็อครหัสผ่าน', icon: <KeyRound size={16} />, color: '#ef4444',
    category: 'account', priority: 'high',
    title: 'ลืมรหัสผ่าน / บัญชีถูกล็อค',
    description: 'ไม่สามารถเข้าสู่ระบบได้\n\nอาการ (เลือกที่ตรงกัน):\n- [ ] ลืมรหัสผ่าน Windows\n- [ ] บัญชีถูกล็อค (Account Locked)\n- [ ] รหัสผ่านหมดอายุ\n\nชื่อบัญชีผู้ใช้ (Username): ',
  },
  {
    label: 'คอมพิวเตอร์ / ซอฟต์แวร์', icon: <Monitor size={16} />, color: '#22c55e',
    category: 'software', priority: 'medium',
    title: 'คอมพิวเตอร์ / โปรแกรมมีปัญหา',
    description: 'คอมพิวเตอร์หรือโปรแกรมทำงานผิดปกติ\n\nรายละเอียด:\n- ชื่อโปรแกรม/อาการ: \n- เกิดขึ้นเมื่อ: \n- Error message ที่ขึ้น: \n- ลองแก้ไขอะไรไปแล้ว: ',
  },
  {
    label: 'อื่นๆ', icon: <HelpCircle size={16} />, color: '#64748b',
    category: 'other', priority: 'medium',
    title: '', description: '',
  },
];

export default function SubmitTicket() {
  const { currentUser, addTicket, navigate } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    requesterName: currentUser.name,
    department: currentUser.department,
    category: 'other',
    priority: 'medium',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<Record<'title' | 'description' | 'requesterName' | 'department', string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const applyTemplate = (tpl: Template) => {
    setForm(p => ({
      ...p,
      category: tpl.category,
      priority: tpl.priority,
      title: tpl.title,
      description: tpl.description,
    }));
    setErrors({});
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.title.trim())         e.title         = 'กรุณากรอกหัวข้อปัญหา';
    if (!form.description.trim())   e.description   = 'กรุณาอธิบายปัญหา';
    if (!form.requesterName.trim()) e.requesterName = 'กรุณากรอกชื่อ';
    if (!form.department.trim())    e.department    = 'กรุณากรอกแผนก';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const newId = await addTicket({
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        status: 'new',
        requesterId: currentUser.id,
        requesterName: form.requesterName,
        department: form.department,
        email: currentUser.email ?? '',
        slaDueTime: new Date(Date.now() + { low: 72, medium: 24, high: 8, critical: 2 }[form.priority] * 3600000).toISOString(),
        attachments: [],
      });
      if (files.length > 0) {
        await TicketsAPI.uploadFiles(newId, files);
      }
      setSubmittedId(newId);
      setSubmitted(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    setFiles(prev => {
      const combined = [...prev];
      for (const f of incoming) {
        if (!combined.find(e => e.name === f.name && e.size === f.size)) combined.push(f);
      }
      return combined;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const field = (label: string, key: keyof typeof errors, children: React.ReactNode) => (
    <div>
      <label className="block text-[12px] font-medium text-white/55 mb-1.5">{label}</label>
      {children}
      {errors[key] && <p className="text-[11px] text-red-400 mt-1">{errors[key]}</p>}
    </div>
  );

  if (submitted) {
    return (
      <div className="module-content flex items-center justify-center fade-in">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-white/90 mb-2">ส่ง Ticket สำเร็จ!</h2>
          <p className="text-sm text-white/50 mb-6">
            ระบบได้รับปัญหาของคุณแล้ว ทีม IT จะติดต่อกลับโดยเร็วที่สุด<br />
            คุณจะได้รับการแจ้งเตือนเมื่อ IT แก้ไขเสร็จ
          </p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
            <div className="text-[11px] text-white/40 mb-1">หมายเลข Ticket</div>
            <div className="text-xl font-mono font-semibold text-blue-300">{submittedId}</div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('my_tickets')} className="win-btn flex-1">ดู Ticket ของฉัน</button>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({ title: '', description: '', category: 'other', priority: 'medium', requesterName: currentUser.name, department: currentUser.department });
                setFiles([]);
              }}
              className="win-btn-ghost flex-1"
            >
              แจ้งปัญหาใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-content fade-in">
      <div className="max-w-2xl mx-auto">
        <div className="mb-5">
          <h2 className="text-[20px] font-semibold text-white/90">แจ้งปัญหา IT</h2>
          <p className="text-sm text-white/40 mt-1">กรอกข้อมูลให้ครบถ้วนเพื่อให้ทีม IT ช่วยเหลือได้รวดเร็วขึ้น</p>
        </div>

        {/* Quick Templates */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2">เลือกประเภทปัญหา (Quick Fill)</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-center"
                style={{
                  background: form.category === tpl.category && tpl.category !== 'other'
                    ? `rgba(${tpl.color.slice(1).match(/../g)!.map(h => parseInt(h, 16)).join(',')}, 0.18)`
                    : 'rgba(255,255,255,0.03)',
                  borderColor: form.category === tpl.category && tpl.category !== 'other'
                    ? `${tpl.color}55` : 'rgba(255,255,255,0.08)',
                  color: form.category === tpl.category && tpl.category !== 'other' ? tpl.color : 'rgba(255,255,255,0.45)',
                }}
              >
                <span style={{ color: tpl.color }}>{tpl.icon}</span>
                <span className="text-[10px] leading-tight">{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Requester Info */}
          <div className="glass-card rounded-xl p-5">
            <div className="section-title">ข้อมูลผู้แจ้ง</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('ชื่อ-นามสกุล *', 'requesterName',
                <input
                  className="win-input"
                  value={form.requesterName}
                  onChange={e => setForm(p => ({ ...p, requesterName: e.target.value }))}
                  placeholder="ชื่อ-นามสกุล"
                />
              )}
              {field('แผนก *', 'department',
                <input
                  className="win-input"
                  value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  placeholder="ชื่อแผนก"
                />
              )}
            </div>
          </div>

          {/* Problem Details */}
          <div className="glass-card rounded-xl p-5">
            <div className="section-title">รายละเอียดปัญหา</div>
            <div className="flex flex-col gap-4">
              {field('หัวข้อปัญหา *', 'title',
                <input
                  className="win-input"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="สรุปปัญหาให้กระชับ เช่น อินเทอร์เน็ตใช้งานไม่ได้ที่แผนกบัญชี"
                />
              )}
              {field('อธิบายปัญหา *', 'description',
                <textarea
                  className="win-input resize-none"
                  rows={5}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="อธิบายรายละเอียดปัญหา เวลาที่เริ่มเกิด ขั้นตอนที่ลองแก้แล้ว..."
                />
              )}
            </div>
          </div>

          {/* Attachment */}
          <div className="glass-card rounded-xl p-5">
            <div className="section-title">ไฟล์แนบ / ภาพหน้าจอ (ถ้ามี)</div>

            {/* Screenshot tip */}
            <div className="mb-3 rounded-xl px-4 py-3 flex gap-3"
              style={{ background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)' }}>
              <Camera size={14} className="text-sky-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[11px] font-semibold text-sky-300 mb-1.5">วิธีแคปภาพหน้าจอ</div>
                <div className="text-[10px] text-white/45 space-y-0.5 leading-relaxed">
                  <div><span className="text-white/60 font-mono bg-white/08 px-1 rounded">Windows</span> กด <span className="font-mono text-sky-300/80">Win + Shift + S</span> (Snipping Tool) หรือ <span className="font-mono text-sky-300/80">PrtSc</span></div>
                  <div><span className="text-white/60 font-mono bg-white/08 px-1 rounded">macOS</span> กด <span className="font-mono text-sky-300/80">Cmd + Shift + 4</span> แล้วลากเลือกพื้นที่</div>
                  <div><span className="text-white/60 font-mono bg-white/08 px-1 rounded">มือถือ</span> กด <span className="font-mono text-sky-300/80">ปุ่มเปิด/ปิด + ปุ่มเพิ่มเสียง</span> พร้อมกัน</div>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED}
              className="hidden"
              onChange={e => addFiles(e.target.files)}
            />
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isDragging ? 'border-sky-400/60 bg-sky-500/08' : 'border-white/10 hover:border-white/20'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
            >
              <Upload size={22} className="mx-auto mb-2 text-white/30" />
              <p className="text-sm text-white/50">คลิกหรือลาก-วางไฟล์ที่นี่</p>
              <p className="text-[11px] text-white/25 mt-1">PNG, JPG, PDF, DOCX, XLSX, TXT, ZIP (สูงสุด 10MB)</p>
            </div>

            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white/06 border border-white/10 rounded-lg px-3 py-1.5">
                    <FileText size={11} className="text-white/40 shrink-0" />
                    <span className="text-[11px] text-white/65 max-w-[160px] truncate">{f.name}</span>
                    <span className="text-[10px] text-white/30">({(f.size / 1024).toFixed(0)}KB)</span>
                    <button
                      type="button"
                      onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                      className="text-white/35 hover:text-red-400 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2 pb-4">
            <p className="text-[11px] text-white/35">* ข้อมูลที่จำเป็น</p>
            <button type="submit" disabled={submitting} className="win-btn flex items-center gap-2 px-6 py-2 disabled:opacity-50">
              <Send size={14} />
              {submitting ? 'กำลังส่ง...' : 'ส่ง Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
