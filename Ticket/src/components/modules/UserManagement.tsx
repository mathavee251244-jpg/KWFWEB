import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, AlertTriangle, ChevronDown, Users, Eye, EyeOff, KeyRound, UserPlus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Role } from '../../types';
import { ROLE_LABELS } from '../../types';

const roleColors: Record<Role, { text: string; bg: string; border: string }> = {
  employee: { text: 'text-green-300', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  it_staff: { text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  it_manager: { text: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

const deptList = ['ทั้งหมด', 'ไอที', 'บัญชี', 'ทรัพยากรบุคคล', 'ขาย', 'เงินเดือน', 'IMEX', 'คลังสินค้า', 'ผลิต', 'QA/QC', 'วิศวกรรม', 'R&D', 'ความปลอดภัย', 'ประชาสัมพันธ์', 'ทั่วไป'];

function RoleDropdown({ current, onChange }: { userId: string; current: Role; onChange: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const cfg = roleColors[current];

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left });
    }
    setOpen(v => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors hover:opacity-80 ${cfg.bg} ${cfg.border} ${cfg.text}`}
      >
        {ROLE_LABELS[current]}
        <ChevronDown size={10} />
      </button>
      {open && createPortal(
        <div className="glass rounded-xl p-1 shadow-window fade-in"
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 144, zIndex: 9999 }}>
          {(['employee', 'it_staff', 'it_manager'] as Role[]).map(r => {
            const rc = roleColors[r];
            return (
              <button key={r} onMouseDown={e => e.stopPropagation()} onClick={() => { onChange(r); setOpen(false); }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-white/08 transition-colors flex items-center gap-2 ${current === r ? 'bg-white/06' : ''}`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: r === 'employee' ? '#22c55e' : r === 'it_staff' ? '#f59e0b' : '#ef4444' }} />
                <span className={rc.text}>{ROLE_LABELS[r]}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

function PwdCell({ userId }: { userId: string }) {
  const { getUserPassword, changePassword } = useApp();
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newPwd, setNewPwd] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const pwd = getUserPassword(userId);

  const handleSave = async () => {
    if (newPwd.length < 6) { setMsg({ text: 'อย่างน้อย 6 ตัวอักษร', ok: false }); return; }
    try {
      await changePassword(userId, newPwd);
      setMsg({ text: 'เปลี่ยนแล้ว', ok: true });
      setNewPwd(''); setShowNew(false);
      setTimeout(() => { setEditing(false); setMsg(null); }, 1000);
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', ok: false });
    }
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            className="win-input pr-8 text-[12px] py-1"
            placeholder="รหัสผ่านใหม่"
            value={newPwd}
            onChange={e => { setNewPwd(e.target.value); setMsg(null); }}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setMsg(null); } }}
            autoFocus
          />
          <button tabIndex={-1} onClick={() => setShowNew(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            {showNew ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
        {msg && <span className={`text-[10px] ${msg.ok ? 'text-green-400' : 'text-red-400'}`}>{msg.ok ? '✓' : '⚠'} {msg.text}</span>}
        <div className="flex gap-1">
          <button onClick={handleSave} disabled={!newPwd}
            className="win-btn text-[10px] px-2 py-0.5 flex-1 disabled:opacity-40">บันทึก</button>
          <button onClick={() => { setEditing(false); setMsg(null); setNewPwd(''); }}
            className="win-btn-ghost text-[10px] px-2 py-0.5">ยกเลิก</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] font-mono text-white/50 select-all">
        {show ? pwd : '••••••••'}
      </span>
      <button onClick={() => setShow(v => !v)} title={show ? 'ซ่อน' : 'แสดงรหัสผ่าน'}
        className="text-white/25 hover:text-white/60 transition-colors">
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <button onClick={() => { setEditing(true); setShow(false); }} title="เปลี่ยนรหัสผ่าน"
        className="text-white/25 hover:text-blue-400 transition-colors">
        <KeyRound size={12} />
      </button>
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { createUser } = useApp();
  const [form, setForm] = useState({ id: '', name: '', department: 'ไอที', email: '', role: 'employee', password: 'Com@1234' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setErr(''); };

  const handleSubmit = async () => {
    if (!form.id || !form.name || !form.department || !form.email) { setErr('กรุณากรอกข้อมูลให้ครบ'); return; }
    if (form.password.length < 6) { setErr('รหัสผ่านอย่างน้อย 6 ตัวอักษร'); return; }
    setLoading(true);
    try {
      await createUser(form);
      onCreated();
      onClose();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-window fade-in" style={{ zIndex: 9999 }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-blue-400" />
            <h3 className="text-[16px] font-semibold text-white/90">สร้างผู้ใช้ใหม่</h3>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors"><X size={16} /></button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-wider">Username / ID *</label>
              <input className="win-input" placeholder="เช่น john.hr" value={form.id} onChange={e => set('id', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-wider">ชื่อ *</label>
              <input className="win-input" placeholder="ชื่อ-นามสกุล" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-white/40 uppercase tracking-wider">อีเมล *</label>
            <input className="win-input" type="email" placeholder="email@bangkokseafood.co.th" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-wider">แผนก *</label>
              <select className="win-select" value={form.department} onChange={e => set('department', e.target.value)}>
                {deptList.filter(d => d !== 'ทั้งหมด').map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-wider">บทบาท</label>
              <select className="win-select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="employee">{ROLE_LABELS.employee}</option>
                <option value="it_staff">{ROLE_LABELS.it_staff}</option>
                <option value="it_manager">{ROLE_LABELS.it_manager}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-white/40 uppercase tracking-wider">รหัสผ่านเริ่มต้น</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                className="win-input pr-9"
                value={form.password}
                onChange={e => set('password', e.target.value)}
              />
              <button tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          {err && (
            <div className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <button onClick={handleSubmit} disabled={loading}
              className="win-btn flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <span className="animate-pulse">กำลังสร้าง...</span> : <><UserPlus size={14} /> สร้างผู้ใช้</>}
            </button>
            <button onClick={onClose} className="win-btn-ghost px-4">ยกเลิก</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function UserManagement() {
  const { currentUser, users, updateUserRole, updateUserStatus, refreshUsers } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [deptFilter, setDeptFilter] = useState('ทั้งหมด');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (currentUser.role !== 'it_manager' && currentUser.role !== 'it_staff') {
    return (
      <div className="module-content flex items-center justify-center">
        <div className="text-center text-white/30">
          <AlertTriangle size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">เฉพาะเจ้าหน้าที่ IT เท่านั้น</p>
        </div>
      </div>
    );
  }

  const isManager = currentUser.role === 'it_manager';

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.department.toLowerCase().includes(q)) return false;
      if (roleFilter && u.role !== roleFilter) return false;
      if (deptFilter !== 'ทั้งหมด' && u.department !== deptFilter) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, deptFilter, statusFilter]);

  const activeCount = users.filter(u => u.status === 'active').length;
  const byRole = {
    employee: users.filter(u => u.role === 'employee').length,
    it_staff: users.filter(u => u.role === 'it_staff').length,
    it_manager: users.filter(u => u.role === 'it_manager').length,
  };

  return (
    <div className="module-content fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-semibold text-white/90">จัดการผู้ใช้</h2>
          <p className="text-sm text-white/40 mt-0.5">{users.length} ผู้ใช้ทั้งหมด · {activeCount} ใช้งานอยู่</p>
        </div>
        {isManager && (
          <button onClick={() => setShowCreateModal(true)}
            className="win-btn flex items-center gap-2 text-[12px]">
            <UserPlus size={14} /> สร้างผู้ใช้
          </button>
        )}
      </div>
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onCreated={() => refreshUsers()} />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {([
          ['พนักงาน', byRole.employee, roleColors.employee],
          ['เจ้าหน้าที่ IT', byRole.it_staff, roleColors.it_staff],
          ['ผู้จัดการ IT', byRole.it_manager, roleColors.it_manager],
        ] as const).map(([label, count, colors]) => (
          <div key={label} className="stat-card rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Users size={13} className={colors.text} />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
            </div>
            <div className={`text-2xl font-light ${colors.text}`}>{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              className="win-input pl-8"
              placeholder="ค้นหาชื่อ, อีเมล, แผนก..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="win-select w-auto min-w-[130px]" value={roleFilter} onChange={e => setRoleFilter(e.target.value as Role | '')}>
            <option value="">บทบาททั้งหมด</option>
            {(['employee', 'it_staff', 'it_manager'] as Role[]).map(r => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <select className="win-select w-auto min-w-[130px]" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            {deptList.map(d => <option key={d} value={d}>{d === 'ทั้งหมด' ? 'แผนกทั้งหมด' : d}</option>)}
          </select>
          <select className="win-select w-auto min-w-[120px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}>
            <option value="">สถานะทั้งหมด</option>
            <option value="active">ใช้งานอยู่</option>
            <option value="inactive">ระงับการใช้งาน</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>ผู้ใช้</th>
                <th>แผนก</th>
                <th>อีเมล</th>
                <th>บทบาท</th>
                <th>รหัสผ่าน</th>
                <th>สถานะ</th>
                <th className="text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const rc = roleColors[user.role];
                const isSelf = user.id === currentUser.id;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                          style={{
                            background: user.role === 'employee' ? 'rgba(34,197,94,0.15)' : user.role === 'it_staff' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                            color: user.role === 'employee' ? '#86efac' : user.role === 'it_staff' ? '#fcd34d' : '#fca5a5',
                          }}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium text-white/80 flex items-center gap-1.5">
                            {user.name}
                            {isSelf && <span className="text-[9px] bg-blue-500/20 border border-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">คุณ</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-white/50 text-xs">{user.department}</td>
                    <td className="text-white/45 text-xs">{user.email}</td>
                    <td>
                      {isSelf || !isManager ? (
                        <span className={`text-[11px] px-2.5 py-1 rounded-full border font-medium ${rc.bg} ${rc.border} ${rc.text}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      ) : (
                        <RoleDropdown userId={user.id} current={user.role} onChange={r => updateUserRole(user.id, r)} />
                      )}
                    </td>
                    <td><PwdCell userId={user.id} /></td>
                    <td>
                      <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
                        user.status === 'active'
                          ? 'bg-green-500/10 border-green-500/20 text-green-300'
                          : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                      }`}>
                        {user.status === 'active' ? 'ใช้งานอยู่' : 'ระงับแล้ว'}
                      </span>
                    </td>
                    <td className="text-right">
                      {!isSelf && isManager && (
                        <button
                          onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                            user.status === 'active'
                              ? 'bg-red-500/08 border-red-500/20 text-red-400/70 hover:bg-red-500/15'
                              : 'bg-green-500/08 border-green-500/20 text-green-400/70 hover:bg-green-500/15'
                          }`}
                        >
                          {user.status === 'active' ? 'ระงับ' : 'เปิดใช้'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-white/30">
            <Users size={28} className="mb-2 opacity-40" />
            <p className="text-sm">ไม่พบผู้ใช้</p>
          </div>
        )}
      </div>

      <div className="mt-2 text-[11px] text-white/25 text-right">
        แสดง {filtered.length} / {users.length} ผู้ใช้
      </div>
    </div>
  );
}
