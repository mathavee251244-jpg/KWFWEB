import { useState, useMemo } from 'react';
import { Search, Filter, X, Ticket, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../shared/StatusBadge';
import PriorityBadge from '../shared/PriorityBadge';
import type { TicketStatus, TicketPriority, TicketCategory } from '../../types';
import { CATEGORY_LABELS, STATUS_LABELS, PRIORITY_LABELS } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

export default function MyTickets() {
  const { currentUser, tickets, navigate } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | ''>('');

  const myTickets = useMemo(() =>
    tickets.filter(t => t.requesterId === currentUser.id),
    [tickets, currentUser.id]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return myTickets.filter(t => {
      if (q && !t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [myTickets, search, statusFilter, priorityFilter, categoryFilter]);

  const hasFilters = search || statusFilter || priorityFilter || categoryFilter;
  const clearFilters = () => { setSearch(''); setStatusFilter(''); setPriorityFilter(''); setCategoryFilter(''); };

  const now = new Date();

  return (
    <div className="module-content fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[20px] font-semibold text-white/90">Ticket ของฉัน</h2>
          <p className="text-sm text-white/40 mt-0.5">{myTickets.length} รายการทั้งหมด · {filtered.length} รายการที่แสดง</p>
        </div>
        <button onClick={() => navigate('submit_ticket')} className="win-btn flex items-center gap-2">
          <Plus size={14} />
          แจ้งปัญหาใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              className="win-input pl-8"
              placeholder="ค้นหาตาม ID หรือหัวข้อ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} className="text-white/30" />
            <select className="win-select w-auto min-w-[130px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value as TicketStatus | '')}>
              <option value="">สถานะทั้งหมด</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="win-select w-auto min-w-[130px]" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as TicketPriority | '')}>
              <option value="">ความสำคัญทั้งหมด</option>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="win-select w-auto min-w-[130px]" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as TicketCategory | '')}>
              <option value="">หมวดหมู่ทั้งหมด</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="win-btn-ghost flex items-center gap-1.5 text-xs">
                <X size={12} /> ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <Ticket size={36} className="mb-3 opacity-40" />
            <p className="text-sm">{hasFilters ? 'ไม่พบ Ticket ที่ตรงกับเงื่อนไข' : 'คุณยังไม่มี Ticket'}</p>
            {!hasFilters && (
              <button onClick={() => navigate('submit_ticket')} className="mt-3 win-btn text-xs">
                แจ้งปัญหาแรก
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>หัวข้อปัญหา</th>
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
                {filtered.map(t => {
                  const isOverdue = new Date(t.slaDueTime) < now && !['resolved', 'closed'].includes(t.status);
                  return (
                    <tr key={t.id} className="ticket-row" onClick={() => navigate('ticket_detail', t.id)}>
                      <td className="text-blue-400/80 font-mono text-xs font-medium">{t.id}</td>
                      <td className="max-w-[220px]">
                        <div className="truncate font-medium text-white/80" title={t.title}>{t.title}</div>
                      </td>
                      <td className="text-white/50 text-xs">{CATEGORY_LABELS[t.category]}</td>
                      <td><PriorityBadge priority={t.priority} size="sm" /></td>
                      <td><StatusBadge status={t.status} size="sm" /></td>
                      <td className="text-white/55 text-xs">{t.assigneeName || <span className="text-white/25 italic">ยังไม่มีผู้รับ</span>}</td>
                      <td>
                        <span className={`text-xs ${isOverdue ? 'text-red-400 font-medium' : 'text-white/40'}`}>
                          {isOverdue ? '⚠ เกิน' : ''} {new Date(t.slaDueTime).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                      <td className="text-white/40 text-xs">{formatDate(t.updatedAt)}</td>
                      <td>
                        <ChevronRight size={14} className="text-white/25 group-hover:text-white/60" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-3 text-[11px] text-white/25 text-right">
        แสดง {filtered.length} / {myTickets.length} รายการ
      </div>
    </div>
  );
}
