import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, X, ChevronRight, AlertTriangle, Clock, Download, ChevronLeft, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import PriorityBadge from '../shared/PriorityBadge';
import type { TicketStatus, TicketPriority, TicketCategory } from '../../types';
import { CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '../../types';
import { clearAllTickets, clearOpenTickets } from '../../api/tickets';

const ITEMS_PER_PAGE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

const depts = ['บัญชี', 'ทรัพยากรบุคคล', 'ขาย', 'การเงิน', 'จัดซื้อ', 'ปฏิบัติการ', 'ไอที'];

export default function AllTickets() {
  const { currentUser, tickets, users, navigate, refreshTickets } = useApp();
  const [clearing, setClearing] = useState(false);
  const [clearingOpen, setClearingOpen] = useState(false);

  if (currentUser.role === 'employee') {
    return (
      <div className="module-content flex items-center justify-center">
        <div className="text-center text-white/30">
          <AlertTriangle size={40} className="mx-auto mb-3 opacity-40" />
          <p>ไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      </div>
    );
  }

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | ''>('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const now = new Date();
  const itStaff = users.filter(u => u.role === 'it_staff' || u.role === 'it_manager');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : 0;
    const toMs = dateTo ? new Date(dateTo + 'T23:59:59').getTime() : Infinity;
    return tickets.filter(t => {
      if (q && !t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q) &&
        !t.requesterName.toLowerCase().includes(q) && !t.department.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q)) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (assigneeFilter === '__unassigned' && t.assigneeId) return false;
      if (assigneeFilter && assigneeFilter !== '__unassigned' && t.assigneeId !== assigneeFilter) return false;
      if (deptFilter && t.department !== deptFilter) return false;
      if (overdueOnly && (new Date(t.slaDueTime) >= now || ['resolved', 'closed'].includes(t.status))) return false;
      if (criticalOnly && t.priority !== 'critical') return false;
      const created = new Date(t.createdAt).getTime();
      if (created < fromMs || created > toMs) return false;
      return true;
    }).sort((a, b) => {
      const pa = ['critical', 'high', 'medium', 'low'].indexOf(a.priority);
      const pb = ['critical', 'high', 'medium', 'low'].indexOf(b.priority);
      if (pa !== pb) return pa - pb;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter, assigneeFilter, deptFilter, overdueOnly, criticalOnly, dateFrom, dateTo]);

  // Reset to page 1 whenever filters change
  const filterKey = [search, statusFilter, priorityFilter, categoryFilter, assigneeFilter, deptFilter, overdueOnly, criticalOnly, dateFrom, dateTo].join('|');
  useEffect(() => { setPage(1); }, [filterKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const hasFilters = search || statusFilter || priorityFilter || categoryFilter || assigneeFilter || deptFilter || overdueOnly || criticalOnly || dateFrom || dateTo;
  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setPriorityFilter(''); setCategoryFilter('');
    setAssigneeFilter(''); setDeptFilter(''); setOverdueOnly(false); setCriticalOnly(false);
    setDateFrom(''); setDateTo('');
  };

  const overdueCount = tickets.filter(t => new Date(t.slaDueTime) < now && !['resolved', 'closed'].includes(t.status)).length;
  const warningCount = tickets.filter(t => {
    const ms = new Date(t.slaDueTime).getTime() - now.getTime();
    return ms > 0 && ms < 2 * 3600_000 && !['resolved', 'closed'].includes(t.status);
  }).length;
  const criticalCount = tickets.filter(t => t.priority === 'critical' && !['resolved', 'closed'].includes(t.status)).length;
  const openCount = tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;

  const exportCSV = () => {
    const headers = ['ID', 'หัวข้อ', 'ผู้แจ้ง', 'แผนก', 'หมวดหมู่', 'ความสำคัญ', 'สถานะ', 'ผู้รับผิดชอบ', 'SLA', 'สร้างเมื่อ', 'อัปเดตเมื่อ'];
    const rows = filtered.map(t => [
      t.id, t.title, t.requesterName, t.department,
      CATEGORY_LABELS[t.category], PRIORITY_LABELS[t.priority],
      STATUS_LABELS[t.status], t.assigneeName ?? '',
      new Date(t.slaDueTime).toLocaleDateString('th-TH'),
      new Date(t.createdAt).toLocaleDateString('th-TH'),
      new Date(t.updatedAt).toLocaleDateString('th-TH'),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="module-content fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-semibold text-white/90">Ticket ทั้งหมด</h2>
          <p className="text-sm text-white/40 mt-0.5">{tickets.length} รายการทั้งหมด · {filtered.length} รายการที่แสดง</p>
        </div>
        <div className="flex items-center gap-2">
          {currentUser.role === 'it_manager' && openCount > 0 && (
            <button
              onClick={async () => {
                if (!confirm(`ลบ Ticket ที่เปิดอยู่ ${openCount} รายการ? (Resolved/Closed จะยังคงอยู่)`)) return;
                setClearingOpen(true);
                try { await clearOpenTickets(); await refreshTickets(); } finally { setClearingOpen(false); }
              }}
              disabled={clearingOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] hover:bg-amber-500/18 transition-colors disabled:opacity-40"
            >
              <Trash2 size={12} />
              {clearingOpen ? 'กำลังลบ...' : `ลบ Ticket ที่เปิดอยู่ (${openCount})`}
            </button>
          )}
          {currentUser.role === 'it_manager' && tickets.length > 0 && (
            <button
              onClick={async () => {
                if (!confirm(`ลบ Ticket ทั้งหมด ${tickets.length} รายการ? ไม่สามารถกู้คืนได้`)) return;
                setClearing(true);
                try { await clearAllTickets(); await refreshTickets(); } finally { setClearing(false); }
              }}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] hover:bg-red-500/18 transition-colors disabled:opacity-40"
            >
              <Trash2 size={12} />
              {clearing ? 'กำลังลบ...' : 'ล้าง Ticket ทั้งหมด'}
            </button>
          )}
          {overdueCount > 0 && (
            <button
              onClick={() => { setOverdueOnly(true); setCriticalOnly(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/12 border border-red-500/25 text-red-300 text-[11px] hover:bg-red-500/20 transition-colors"
            >
              <Clock size={12} />
              เกิน SLA {overdueCount}
            </button>
          )}
          {warningCount > 0 && (
            <button
              onClick={() => { setOverdueOnly(false); setCriticalOnly(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/12 border border-amber-500/25 text-amber-300 text-[11px] hover:bg-amber-500/20 transition-colors"
              title="ใกล้ครบกำหนด SLA ภายใน 2 ชั่วโมง"
            >
              <Clock size={12} />
              ใกล้ครบ {warningCount}
            </button>
          )}
          {criticalCount > 0 && (
            <button
              onClick={() => { setCriticalOnly(true); setOverdueOnly(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/12 border border-orange-500/25 text-orange-300 text-[11px] hover:bg-orange-500/20 transition-colors"
            >
              <AlertTriangle size={12} />
              วิกฤต {criticalCount}
            </button>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-[11px] hover:bg-white/10 hover:text-white/75 transition-colors"
            title="ส่งออก CSV"
          >
            <Download size={12} />
            CSV
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'รายการเปิด', count: openCount, color: 'text-blue-400' },
          { label: 'กำลังดำเนินการ', count: tickets.filter(t => t.status === 'in_progress').length, color: 'text-amber-400' },
          { label: 'เกิน SLA', count: overdueCount, color: 'text-red-400' },
          { label: 'วิกฤต', count: criticalCount, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="stat-card rounded-xl text-center">
            <div className={`text-2xl font-light ${s.color}`}>{s.count}</div>
            <div className="text-[10px] text-white/35 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={13} className="text-white/40" />
          <span className="text-[11px] text-white/40 font-medium uppercase tracking-wider">ตัวกรอง</span>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto win-btn-ghost flex items-center gap-1 text-xs py-1">
              <X size={11} /> ล้างทั้งหมด
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <div className="relative col-span-2 sm:col-span-2">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              className="win-input pl-8"
              placeholder="ค้นหา ID, หัวข้อ, ผู้แจ้ง, แผนก, รายละเอียด..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="win-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as TicketStatus | '')}>
            <option value="">สถานะทั้งหมด</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="win-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as TicketPriority | '')}>
            <option value="">ความสำคัญทั้งหมด</option>
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <select className="win-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as TicketCategory | '')}>
            <option value="">หมวดหมู่ทั้งหมด</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="win-select" value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
            <option value="">ผู้รับผิดชอบทั้งหมด</option>
            <option value="__unassigned">ยังไม่ได้มอบหมาย</option>
            {itStaff.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select className="win-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">แผนกทั้งหมด</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={overdueOnly} onChange={e => setOverdueOnly(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-500" />
              <span className="text-[11px] text-white/60">เกิน SLA</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={criticalOnly} onChange={e => setCriticalOnly(e.target.checked)}
                className="w-3.5 h-3.5 accent-blue-500" />
              <span className="text-[11px] text-white/60">วิกฤต</span>
            </label>
          </div>
        </div>
        {/* Date range */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-white/35 shrink-0">สร้างระหว่าง</span>
          <input type="date" className="win-input text-xs py-1 px-2 w-36"
            value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-[11px] text-white/25">–</span>
          <input type="date" className="win-input text-xs py-1 px-2 w-36"
            value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/30">
            <p className="text-sm">ไม่พบ Ticket ที่ตรงกับเงื่อนไข</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>หัวข้อปัญหา</th>
                  <th>ผู้แจ้ง</th>
                  <th>แผนก</th>
                  <th>หมวดหมู่</th>
                  <th>ความสำคัญ</th>
                  <th>สถานะ</th>
                  <th>ผู้รับผิดชอบ</th>
                  <th>SLA</th>
                  <th>อัปเดต</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => {
                  const slaMs = new Date(t.slaDueTime).getTime() - now.getTime();
                  const isDone = ['resolved', 'closed'].includes(t.status);
                  const isOverdue = slaMs < 0 && !isDone;
                  const isWarning = !isOverdue && slaMs < 2 * 3600_000 && !isDone;
                  return (
                    <tr key={t.id} className="ticket-row" onClick={() => navigate('ticket_detail', t.id)}>
                      <td className="font-mono text-xs text-blue-400/80 font-medium">{t.id}</td>
                      <td className="max-w-[180px]">
                        <div className="truncate font-medium text-white/80" title={t.title}>{t.title}</div>
                      </td>
                      <td className="text-white/60 text-xs">{t.requesterName}</td>
                      <td className="text-white/45 text-xs">{t.department}</td>
                      <td className="text-white/45 text-xs">{CATEGORY_LABELS[t.category]}</td>
                      <td><PriorityBadge priority={t.priority} size="sm" /></td>
                      <td><StatusBadge status={t.status} size="sm" /></td>
                      <td className="text-white/55 text-xs">{t.assigneeName || <span className="text-white/25 italic">–</span>}</td>
                      <td>
                        <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-white/40'}`}>
                          {isOverdue ? '⚠ ' : isWarning ? '⏰ ' : ''}
                          {new Date(t.slaDueTime).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                      <td className="text-white/40 text-xs">{formatDate(t.updatedAt)}</td>
                      <td><ChevronRight size={13} className="text-white/25" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination + count */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-white/25">
          แสดง {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} จาก {filtered.length} รายการ
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-lg text-xs transition-colors ${p === page ? 'bg-blue-500/25 text-blue-300 font-medium' : 'text-white/40 hover:text-white/80 hover:bg-white/8'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/8 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
