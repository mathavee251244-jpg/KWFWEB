import { Wifi, ArrowLeft, ExternalLink, Zap, Download, Upload, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NPERF_URL = 'https://www.nperf.com/th/';

export default function SpeedTest() {
  const { navigate } = useApp();

  return (
    <div className="module-content fade-in flex flex-col items-center justify-center" style={{ minHeight: '70vh' }}>
      {/* Back button */}
      <div className="w-full max-w-lg mb-6 self-start pl-0">
        <button
          onClick={() => navigate('system_status')}
          className="flex items-center gap-2 text-[12px] text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft size={14} />
          กลับ System Status
        </button>
      </div>

      {/* Card */}
      <div className="glass-card rounded-2xl p-10 max-w-lg w-full text-center">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-icon"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(6,182,212,0.10))',
            border: '1px solid rgba(6,182,212,0.35)',
            boxShadow: '0 8px 32px rgba(6,182,212,0.2)',
          }}
        >
          <Zap size={36} className="text-cyan-300" />
        </div>

        <h2 className="text-[22px] font-semibold text-white/90 mb-2">ทดสอบความเร็วอินเทอร์เน็ต</h2>
        <p className="text-[13px] text-white/45 mb-8 leading-relaxed">
          ใช้ <span className="text-cyan-300 font-medium">nperf.com</span> วัดความเร็ว Download, Upload และ Latency<br />
          ของการเชื่อมต่ออินเทอร์เน็ตในองค์กร
        </p>

        {/* Feature pills */}
        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          {[
            { icon: <Download size={12} />, label: 'Download Speed' },
            { icon: <Upload size={12} />, label: 'Upload Speed' },
            { icon: <Activity size={12} />, label: 'Ping / Latency' },
            { icon: <Wifi size={12} />, label: 'Jitter' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/05 border border-white/10 text-[11px] text-white/50">
              <span className="text-cyan-400">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* Main CTA button */}
        <button
          onClick={() => window.open(NPERF_URL, '_blank')}
          className="w-full py-3.5 rounded-xl text-[15px] font-medium transition-all flex items-center justify-center gap-2.5 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.30), rgba(6,182,212,0.15))',
            border: '1px solid rgba(6,182,212,0.40)',
            color: '#67e8f9',
            boxShadow: '0 4px 20px rgba(6,182,212,0.15)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.40), rgba(6,182,212,0.22))')}
          onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.30), rgba(6,182,212,0.15))')}
        >
          <ExternalLink size={16} />
          เริ่มทดสอบความเร็ว
        </button>

        <p className="text-[10px] text-white/25">เปิดใน new tab · nperf.com/th/</p>
      </div>

      {/* Note */}
      <p className="text-[11px] text-white/20 mt-5 text-center">
        ไม่สามารถฝังหน้าเว็บได้โดยตรง เนื่องจาก nperf.com ตั้งค่า X-Frame-Options
      </p>
    </div>
  );
}
