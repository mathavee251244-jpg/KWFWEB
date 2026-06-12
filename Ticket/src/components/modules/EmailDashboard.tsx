import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Mail, HardDrive, ArrowLeft, Shield, Activity, Users, Wifi, Bug, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const MAIL_ADMIN_URL = 'https://mailstd-01.zth.netdesignhost.com/interface/root#/reports/domain/domain';

const DISK_TOTAL = 10.0;
const DISK_USED = 7.3;

const diskBreakdown = [
  { name: 'Mailbox',       value: 5.18, color: '#3b82f6' },
  { name: 'Appointments',  value: 0.62, color: '#8b5cf6' },
  { name: 'Contacts',      value: 0.41, color: '#06b6d4' },
  { name: 'Tasks',         value: 0.28, color: '#f59e0b' },
  { name: 'Notes',         value: 0.21, color: '#10b981' },
  { name: 'Other',         value: 0.60, color: '#64748b' },
];

const bandwidthData = [
  { name: 'SMTP In',  gb: 5.12, color: '#3b82f6' },
  { name: 'SMTP Out', gb: 6.18, color: '#8b5cf6' },
  { name: 'IMAP',     gb: 1.84, color: '#06b6d4' },
  { name: 'POP',      gb: 1.76, color: '#10b981' },
];

const inboundData = [
  { name: 'Trusted',  value: 2100, color: '#22c55e' },
  { name: 'Standard', value: 1949, color: '#3b82f6' },
  { name: 'Spam',     value: 1437, color: '#ef4444' },
];

const spamData = [
  { name: 'Low',    value: 800, color: '#f59e0b' },
  { name: 'Medium', value: 400, color: '#f97316' },
  { name: 'High',   value: 237, color: '#ef4444' },
];

function StatCard({ label, value, sub, color = 'text-white/80', icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-white/35">{icon}</div>
        <span className="text-[10px] text-white/35 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-2xl font-light tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2.5">
      <div className="text-[11px] text-white/45 w-20 shrink-0 truncate">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-white/06 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[11px] text-white/55 tabular-nums w-12 text-right">{value.toLocaleString()}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 text-[11px] text-white/80 shadow-window border border-white/10">
        <strong>{payload[0].name}</strong>: {payload[0].value} GB
      </div>
    );
  }
  return null;
};

export default function EmailDashboard() {
  const { currentUser, navigate } = useApp();

  if (currentUser.role === 'employee') {
    return (
      <div className="module-content flex items-center justify-center">
        <div className="text-center text-white/30">
          <Shield size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">เฉพาะเจ้าหน้าที่ IT เท่านั้น</p>
        </div>
      </div>
    );
  }

  const diskPct = Math.round((DISK_USED / DISK_TOTAL) * 100);
  const diskFree = +(DISK_TOTAL - DISK_USED).toFixed(1);
  const totalBandwidth = bandwidthData.reduce((s, d) => s + d.gb, 0);

  return (
    <div className="module-content fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('system_status')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/06 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-blue-400" />
              <h2 className="text-[20px] font-semibold text-white/90">Email Server Dashboard</h2>
            </div>
            <p className="text-[11px] text-white/35 mt-0.5 ml-6">mailstd-01.zth.netdesignhost.com · รายงาน 30 วัน (ข้อมูลตัวอย่าง)</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-green-300">Online</span>
          </div>
          <button
            onClick={() => window.open(MAIL_ADMIN_URL, '_blank')}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] text-blue-300 hover:text-blue-200 bg-blue-500/12 hover:bg-blue-500/20 border border-blue-500/25 transition-colors"
          >
            <ExternalLink size={12} />
            เปิด Admin Panel
          </button>
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Inbound Messages"  value="5,486" sub="ข้อความขาเข้า"  color="text-blue-300"   icon={<Activity size={13} />} />
        <StatCard label="Outbound Messages" value="5,382" sub="ข้อความขาออก"  color="text-purple-300" icon={<Activity size={13} />} />
        <StatCard label="Inbound Spam"      value="1,437" sub="26.2% ของขาเข้า" color="text-red-300"  icon={<Shield size={13} />} />
        <StatCard label="Viruses Caught"    value="1"     sub="ตรวจพบไวรัส"    color="text-orange-300" icon={<Bug size={13} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Disk Usage */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive size={13} className="text-white/40" />
            <span className="section-title mb-0">Disk Usage</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <PieChart width={110} height={110}>
                <Pie data={diskBreakdown} cx={50} cy={50} innerRadius={32} outerRadius={50}
                  dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                  {diskBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-[18px] font-light text-white/85 tabular-nums">{diskPct}%</div>
                <div className="text-[9px] text-white/35">ใช้แล้ว</div>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="text-[13px] font-medium text-white/70 tabular-nums">
                {DISK_USED} GB <span className="text-white/30 font-normal">/ {DISK_TOTAL} GB</span>
              </div>
              <div className="text-[10px] text-white/35">ว่างเหลือ {diskFree} GB</div>
              <div className="mt-3 space-y-1.5">
                {diskBreakdown.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-[10px] text-white/40 flex-1">{d.name}</span>
                    <span className="text-[10px] text-white/55 tabular-nums">{d.value} GB</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bandwidth */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wifi size={13} className="text-white/40" />
            <span className="section-title mb-0">Bandwidth Overview</span>
          </div>
          <div className="text-[22px] font-light text-white/80 tabular-nums mb-1">{totalBandwidth.toFixed(2)} GB</div>
          <div className="text-[10px] text-white/35 mb-4">รวมทั้งหมด 30 วัน</div>
          <div className="h-[120px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandwidthData} barSize={20} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.35)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="gb" radius={[4, 4, 0, 0]}>
                  {bandwidthData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {bandwidthData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                <span className="text-[10px] text-white/40">{d.name}</span>
                <span className="text-[10px] text-white/55 ml-auto tabular-nums">{d.gb} GB</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={13} className="text-white/40" />
            <span className="section-title mb-0">Sessions (30 วัน)</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'SMTP In',  value: 633,   color: '#3b82f6', max: 55000 },
              { label: 'SMTP Out', value: 476,   color: '#8b5cf6', max: 55000 },
              { label: 'POP',      value: 51169, color: '#10b981', max: 55000 },
              { label: 'IMAP',     value: 0,     color: '#06b6d4', max: 55000 },
            ].map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-white/45">{s.label}</span>
                  <span className="text-[12px] font-medium text-white/70 tabular-nums">{s.value.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/06 overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.max((s.value / s.max) * 100, s.value > 0 ? 1 : 0)}%`,
                    background: s.color, opacity: 0.8,
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/06">
            <div className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Other</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/04 border border-white/06 p-2.5 text-center">
                <div className="text-[18px] font-light text-amber-300 tabular-nums">35</div>
                <div className="text-[9px] text-white/30 mt-0.5">Greylisted</div>
              </div>
              <div className="rounded-lg bg-white/04 border border-white/06 p-2.5 text-center">
                <div className="text-[18px] font-light text-slate-300 tabular-nums">0</div>
                <div className="text-[9px] text-white/30 mt-0.5">Throttled</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Inbound Breakdown */}
        <div className="glass-card rounded-xl p-5">
          <div className="section-title">Inbound Messages Breakdown</div>
          <div className="text-[22px] font-light text-white/80 tabular-nums mb-4">5,486</div>
          <div className="space-y-2.5">
            {inboundData.map(d => <MiniBar key={d.name} label={d.name} value={d.value} max={5486} color={d.color} />)}
          </div>
          <div className="mt-4 pt-3 border-t border-white/06 grid grid-cols-3 gap-2">
            {inboundData.map(d => (
              <div key={d.name} className="text-center">
                <div className="text-[15px] font-light tabular-nums" style={{ color: d.color }}>{d.value.toLocaleString()}</div>
                <div className="text-[9px] text-white/30 mt-0.5">{d.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Spam Breakdown */}
        <div className="glass-card rounded-xl p-5">
          <div className="section-title">Inbound Spam Breakdown</div>
          <div className="flex items-end gap-3 mb-4">
            <div className="text-[22px] font-light text-red-300 tabular-nums">1,437</div>
            <div className="text-[11px] text-white/35 mb-1">= 26.2% ของขาเข้า</div>
          </div>
          <div className="space-y-2.5">
            {spamData.map(d => <MiniBar key={d.name} label={d.name} value={d.value} max={1437} color={d.color} />)}
          </div>
          <div className="mt-4 pt-3 border-t border-white/06 grid grid-cols-3 gap-2">
            {spamData.map(d => (
              <div key={d.name} className="text-center">
                <div className="text-[15px] font-light tabular-nums" style={{ color: d.color }}>{d.value.toLocaleString()}</div>
                <div className="text-[9px] text-white/30 mt-0.5">{d.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-white/06 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug size={12} className="text-orange-400" />
              <span className="text-[11px] text-white/50">Viruses Caught</span>
            </div>
            <span className="text-[15px] font-medium text-orange-300 tabular-nums">1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
