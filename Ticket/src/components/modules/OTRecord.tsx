import { useState, useMemo } from 'react';
import {
  Timer, Plus, Trash2, ChevronDown, ChevronUp,
  Printer, CheckCircle2, XCircle, Send, Clock, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { OTRecord, OTStatus } from '../../types';
import { OT_STATUS_LABELS } from '../../types';

const OT_RATE = 1.5;

function todayStr() { return new Date().toISOString().slice(0, 10); }

function calcHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, Math.round((diff / 60) * 10) / 10);
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

function monthKey(iso: string) { return iso.slice(0, 7); }
function fmtMonth(key: string) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
}

const STATUS_CFG: Record<OTStatus, { label: string; color: string; bg: string; border: string }> = {
  draft:     { label: 'ร่าง',        color: 'text-white/50',    bg: 'bg-white/05',     border: 'border-white/10' },
  submitted: { label: 'รออนุมัติ',   color: 'text-amber-300',   bg: 'bg-amber-500/10', border: 'border-amber-500/25' },
  approved:  { label: 'อนุมัติแล้ว', color: 'text-green-300',   bg: 'bg-green-500/10', border: 'border-green-500/25' },
  rejected:  { label: 'ไม่อนุมัติ',  color: 'text-red-300',     bg: 'bg-red-500/10',   border: 'border-red-500/25' },
};

// ── Print A4 ───────────────────────────────────────────────
function PrintView({ records, user }: { records: OTRecord[]; user: { name: string; department: string } }) {
  const total = records.reduce((s, r) => s + r.hours, 0);
  const printDate = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div id="ot-print-area" className="hidden print:block bg-white text-black p-8 text-[12px] font-sans" style={{ minHeight: '297mm', width: '210mm' }}>
      <div className="text-center mb-6">
        <div className="text-[16px] font-bold">บริษัท เทคโนโลยี จำกัด</div>
        <div className="text-[14px] font-semibold mt-1">ใบบันทึกการทำงานล่วงเวลา (OT)</div>
      </div>

      <table className="w-full mb-4 border-collapse text-[11px]">
        <tbody>
          <tr>
            <td className="border border-gray-400 px-3 py-1.5 bg-gray-50 font-semibold w-32">ชื่อ-นามสกุล</td>
            <td className="border border-gray-400 px-3 py-1.5">{user.name}</td>
            <td className="border border-gray-400 px-3 py-1.5 bg-gray-50 font-semibold w-24">แผนก</td>
            <td className="border border-gray-400 px-3 py-1.5">{user.department}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-3 py-1.5 bg-gray-50 font-semibold">วันที่พิมพ์</td>
            <td className="border border-gray-400 px-3 py-1.5" colSpan={3}>{printDate}</td>
          </tr>
        </tbody>
      </table>

      <table className="w-full border-collapse text-[11px] mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 px-2 py-1.5 text-left w-8">#</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left w-28">วันที่</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left w-20">เวลาเริ่ม</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left w-20">เวลาสิ้นสุด</th>
            <th className="border border-gray-400 px-2 py-1.5 text-right w-16">ชม. OT</th>
            <th className="border border-gray-400 px-2 py-1.5 text-left">รายละเอียด</th>
            <th className="border border-gray-400 px-2 py-1.5 text-center w-20">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.id} className={i % 2 === 0 ? '' : 'bg-gray-50'}>
              <td className="border border-gray-400 px-2 py-1.5">{i + 1}</td>
              <td className="border border-gray-400 px-2 py-1.5">{fmtDate(r.date)}</td>
              <td className="border border-gray-400 px-2 py-1.5">{r.startTime}</td>
              <td className="border border-gray-400 px-2 py-1.5">{r.endTime}</td>
              <td className="border border-gray-400 px-2 py-1.5 text-right font-semibold">{r.hours}</td>
              <td className="border border-gray-400 px-2 py-1.5">{r.description}</td>
              <td className="border border-gray-400 px-2 py-1.5 text-center">{OT_STATUS_LABELS[r.status]}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td colSpan={4} className="border border-gray-400 px-2 py-1.5 text-right">รวมชั่วโมง OT</td>
            <td className="border border-gray-400 px-2 py-1.5 text-right">{total.toFixed(1)}</td>
            <td className="border border-gray-400 px-2 py-1.5" colSpan={2}>
              อัตรา OT ×{OT_RATE} = {(total * OT_RATE).toFixed(1)} ชม. ปกติ
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-10">ลายมือชื่อพนักงาน</div>
          <div className="text-gray-500 text-[10px] mt-1">({user.name})</div>
          <div className="text-gray-500 text-[10px]">วันที่ ...................</div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 pt-2 mt-10">ลายมือชื่อผู้อนุมัติ</div>
          <div className="text-gray-500 text-[10px] mt-1">(ผู้จัดการ IT)</div>
          <div className="text-gray-500 text-[10px]">วันที่ ...................</div>
        </div>
      </div>
    </div>
  );
}

// ── Add Form ───────────────────────────────────────────────
function AddForm({ onAdd, onClose }: { onAdd: (data: { date: string; startTime: string; endTime: string; hours: number; description: string }) => void; onClose: () => void }) {
  const [date, setDate] = useState(todayStr());
  const [start, setStart] = useState('18:00');
  const [end, setEnd]     = useState('20:00');
  const [desc, setDesc]   = useState('');
  const [err, setErr]     = useState('');

  const hours = calcHours(start, end);

  const handleAdd = () => {
    if (!date || !start || !end || !desc.trim()) { setErr('กรุณากรอกข้อมูลให้ครบ'); return; }
    if (hours <= 0) { setErr('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม'); return; }
    onAdd({ date, startTime: start, endTime: end, hours, description: desc.trim() });
    onClose();
  };

  return (
    <div className="glass-card rounded-xl p-4 mb-4 border border-blue-500/20 fade-in">
      <div className="section-title text-blue-400/70">เพิ่มรายการ OT ใหม่</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div>
          <label className="block text-[10px] text-white/40 mb-1">วันที่</label>
          <input type="date" className="win-input text-[12px]" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1">เวลาเริ่ม</label>
          <input type="time" className="win-input text-[12px]" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1">เวลาสิ้นสุด</label>
          <input type="time" className="win-input text-[12px]" value={end} onChange={e => setEnd(e.target.value)} />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1">ชั่วโมง OT</label>
          <div className="win-input text-[12px] flex items-center justify-between">
            <span className={hours > 0 ? 'text-blue-300 font-semibold' : 'text-white/30'}>{hours > 0 ? `${hours} ชม.` : '-'}</span>
            {hours > 0 && <span className="text-[10px] text-white/30">×{OT_RATE} = {(hours * OT_RATE).toFixed(1)}</span>}
          </div>
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-[10px] text-white/40 mb-1">รายละเอียดงาน *</label>
        <textarea className="win-input resize-none text-[12px]" rows={2} placeholder="ระบุงานที่ทำ..." value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      {err && <p className="text-[11px] text-red-400 mb-2">{err}</p>}
      <div className="flex gap-2">
        <button onClick={handleAdd} className="win-btn flex items-center gap-1.5 text-[12px]"><Plus size={12} />บันทึก (Draft)</button>
        <button onClick={onClose} className="win-btn-ghost text-[12px]">ยกเลิก</button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function OTRecord() {
  const { currentUser, otRecords, addOTRecord, deleteOTRecord, submitOTRecord, approveOTRecord, rejectOTRecord, getMyOTRecords } = useApp();
  const isManager = currentUser.role === 'it_manager';
  const records = isManager ? otRecords : getMyOTRecords();

  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const grouped = useMemo(() => {
    const map = new Map<string, OTRecord[]>();
    records.forEach(r => {
      const k = monthKey(r.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [records]);

  const totalApprovedHours = records.filter(r => r.status === 'approved').reduce((s, r) => s + r.hours, 0);

  const handleAdd = async (data: { date: string; startTime: string; endTime: string; hours: number; description: string }) => {
    await addOTRecord({ ...data, userId: currentUser.id, userName: currentUser.name, status: 'draft' });
  };

  const doAction = async (id: string, action: () => Promise<void>) => {
    setActionLoading(id);
    try { await action(); } finally { setActionLoading(null); }
  };

  const handlePrint = () => {
    const myRecords = isManager
      ? records.filter(r => r.status === 'approved')
      : records;
    if (myRecords.length === 0) { alert('ไม่มีรายการ OT ที่จะพิมพ์'); return; }
    window.print();
  };

  const printRecords = isManager ? records.filter(r => r.status === 'approved') : records;

  return (
    <div className="module-content fade-in">
      {/* Print-only area */}
      <PrintView records={printRecords} user={currentUser} />

      {/* Screen UI */}
      <div className="print:hidden">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[20px] font-semibold text-white/90">บันทึก OT</h2>
            <p className="text-sm text-white/40 mt-0.5">
              {isManager ? `OT ทั้งหมด — ${records.length} รายการ` : `OT ของฉัน — อนุมัติแล้ว ${totalApprovedHours.toFixed(1)} ชม.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="win-btn-ghost flex items-center gap-1.5 text-[12px]">
              <Printer size={13} />
              พิมพ์ / PDF
            </button>
            {!isManager && (
              <button onClick={() => setShowForm(v => !v)} className="win-btn flex items-center gap-1.5 text-[12px]">
                <Plus size={13} />
                เพิ่ม OT
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {(['draft', 'submitted', 'approved', 'rejected'] as OTStatus[]).map(s => {
            const cfg = STATUS_CFG[s];
            const count = records.filter(r => r.status === s).length;
            return (
              <div key={s} className={`glass-card rounded-xl p-3 border ${cfg.border}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${cfg.color}`}>{cfg.label}</div>
                <div className="text-2xl font-light text-white/85">{count}</div>
              </div>
            );
          })}
        </div>

        {showForm && (
          <AddForm onAdd={handleAdd} onClose={() => setShowForm(false)} />
        )}

        {/* Records by month */}
        {grouped.length === 0 ? (
          <div className="glass-card rounded-xl p-10 text-center text-white/30">
            <Timer size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{isManager ? 'ยังไม่มีรายการ OT' : 'ยังไม่มีรายการ OT — กด "เพิ่ม OT" เพื่อเริ่ม'}</p>
          </div>
        ) : grouped.map(([month, recs]) => {
          const isOpen = expanded.has(month);
          const monthTotal = recs.reduce((s, r) => s + r.hours, 0);
          const monthApproved = recs.filter(r => r.status === 'approved').reduce((s, r) => s + r.hours, 0);
          return (
            <div key={month} className="glass-card rounded-xl mb-3 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/03 transition-colors"
                onClick={() => setExpanded(prev => {
                  const next = new Set(prev);
                  next.has(month) ? next.delete(month) : next.add(month);
                  return next;
                })}
              >
                <span className="text-[13px] font-medium text-white/80">{fmtMonth(month)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-white/40">{recs.length} รายการ · {monthTotal} ชม. OT</span>
                  {monthApproved > 0 && <span className="text-[10px] text-green-300 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">อนุมัติ {monthApproved} ชม.</span>}
                  {isOpen ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-white/06">
                  {recs.sort((a, b) => b.date.localeCompare(a.date)).map(r => {
                    const cfg = STATUS_CFG[r.status];
                    const isLoading = actionLoading === r.id;
                    return (
                      <div key={r.id} className="px-4 py-3 border-b border-white/04 last:border-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-[12px] font-medium text-white/80">{fmtDate(r.date)}</span>
                              <span className="text-[11px] text-white/40">{r.startTime} – {r.endTime}</span>
                              <span className="text-[11px] font-semibold text-blue-300">{r.hours} ชม.</span>
                              {isManager && <span className="text-[10px] text-white/35">{r.userName}</span>}
                            </div>
                            <p className="text-[11px] text-white/55 truncate">{r.description}</p>
                            {r.rejectReason && (
                              <p className="text-[10px] text-red-400/70 mt-0.5">เหตุผล: {r.rejectReason}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            {/* Employee actions */}
                            {!isManager && r.status === 'draft' && (
                              <>
                                <button
                                  onClick={() => doAction(r.id, () => submitOTRecord(r.id))}
                                  disabled={isLoading}
                                  title="ส่งขออนุมัติ"
                                  className="p-1 text-amber-400/60 hover:text-amber-300 transition-colors disabled:opacity-40"
                                >
                                  <Send size={13} />
                                </button>
                                <button
                                  onClick={() => doAction(r.id, () => deleteOTRecord(r.id))}
                                  disabled={isLoading}
                                  title="ลบ"
                                  className="p-1 text-white/25 hover:text-red-400 transition-colors disabled:opacity-40"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                            {/* Manager actions */}
                            {isManager && r.status === 'submitted' && (
                              <>
                                <button
                                  onClick={() => doAction(r.id, () => approveOTRecord(r.id))}
                                  disabled={isLoading}
                                  title="อนุมัติ"
                                  className="p-1 text-green-400/60 hover:text-green-300 transition-colors disabled:opacity-40"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                                <button
                                  onClick={() => { setRejectId(r.id); setRejectReason(''); }}
                                  disabled={isLoading}
                                  title="ไม่อนุมัติ"
                                  className="p-1 text-red-400/60 hover:text-red-300 transition-colors disabled:opacity-40"
                                >
                                  <XCircle size={14} />
                                </button>
                              </>
                            )}
                            {isLoading && <Clock size={12} className="text-white/30 animate-spin" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Reject modal */}
        {rejectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 w-[380px] shadow-window border border-red-500/20">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-red-400" />
                <span className="text-[14px] font-semibold text-white/85">ไม่อนุมัติ OT</span>
              </div>
              <textarea
                className="win-input resize-none mb-4"
                rows={3}
                placeholder="เหตุผลที่ไม่อนุมัติ (ไม่จำเป็น)..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    doAction(rejectId, () => rejectOTRecord(rejectId, rejectReason));
                    setRejectId(null);
                  }}
                  className="win-btn flex-1 text-red-300 border-red-500/30"
                >
                  ยืนยันไม่อนุมัติ
                </button>
                <button onClick={() => setRejectId(null)} className="win-btn-ghost flex-1">ยกเลิก</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
