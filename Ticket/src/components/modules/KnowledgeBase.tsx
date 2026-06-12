import { useState, useEffect, useCallback } from 'react';
import {
  Search, BookOpen, ThumbsUp, Eye, ChevronDown, ChevronUp,
  Tag, X, Pin, PinOff, Trash2, Plus, AlertTriangle,
  FileText, ArrowLeft, ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import * as DocsAPI from '../../api/docs';
import type { DocFile } from '../../api/docs';

const CATEGORIES = ['อินเทอร์เน็ต', 'อีเมล', 'บัญชีผู้ใช้', 'VPN', 'เครื่องพิมพ์', 'ซอฟต์แวร์', 'ความปลอดภัย'];
const CATEGORY_FILTER = ['ทั้งหมด', ...CATEGORIES];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderContent(content: string) {
  return content.split('\n').map((line, i) => {
    if (line.startsWith('## ')) return <h2 key={i} className="text-[14px] font-semibold text-white/80 mt-3 mb-1">{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} className="text-[13px] font-medium text-white/70 mt-2 mb-1">{line.slice(4)}</h3>;
    if (line.startsWith('- ')) return <div key={i} className="flex gap-2 ml-3 mb-0.5"><span className="text-white/30 mt-0.5">•</span><span>{line.slice(2)}</span></div>;
    if (/^\d+\./.test(line)) return <div key={i} className="flex gap-2 ml-3 mb-0.5"><span className="text-blue-400/60 shrink-0">{line.match(/^\d+\./)?.[0]}</span><span>{line.replace(/^\d+\.\s*/, '')}</span></div>;
    if (line === '') return <div key={i} className="h-1.5" />;
    return <p key={i} className="mb-1">{line}</p>;
  });
}

const EMPTY_FORM = { title: '', category: CATEGORIES[0], summary: '', content: '', tags: '' };

// ─── Markdown renderer for MD files ───────────────────────

function renderInline(text: string): React.ReactNode {
  // Handle bold + link in sequence
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[0].startsWith('**')) {
      parts.push(<strong key={m.index} className="text-white/85 font-semibold">{m[2]}</strong>);
    } else {
      parts.push(
        <a key={m.index} href={m[4]} target="_blank" rel="noopener noreferrer"
          className="text-sky-400 hover:text-sky-300 underline underline-offset-2 inline-flex items-center gap-0.5 text-[12px]">
          {m[3]}<ExternalLink size={10} className="shrink-0" />
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
}

function parseTableRow(row: string): string[] {
  return row.split('|').slice(1, -1).map(c => c.trim());
}

function isSeparatorRow(row: string): boolean {
  return /^\s*\|[\s\-:|]+\|\s*$/.test(row);
}

function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table block
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const nonSep = tableLines.filter(l => !isSeparatorRow(l));
      if (nonSep.length >= 1) {
        const headers = parseTableRow(nonSep[0]);
        const rows = nonSep.slice(1);
        elements.push(
          <div key={`tbl-${i}`} className="overflow-x-auto my-3 rounded-lg border border-white/[0.08]">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.04]">
                  {headers.map((h, j) => (
                    <th key={j} className="px-3 py-2 text-left font-semibold text-white/60 whitespace-nowrap">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    {parseTableRow(row).map((c, j) => (
                      <td key={j} className="px-3 py-2 text-white/70 align-top">{renderInline(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-[13px] font-semibold text-white/80 mt-4 mb-1.5">{renderInline(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-[15px] font-semibold text-white/85 mt-5 mb-2 pb-1.5 border-b border-white/[0.06]">{renderInline(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-[18px] font-bold text-white/90 mt-2 mb-3">{renderInline(trimmed.slice(2))}</h1>);
    } else if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-sky-500/40 pl-3 my-2 text-[12px] text-white/50 italic">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
    } else if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={i} className="my-4 border-white/[0.06]" />);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-2 flex flex-col gap-0.5">
          {listItems.map((item, j) => (
            <li key={j} className="flex gap-2 text-[12px] text-white/65">
              <span className="text-white/25 shrink-0 mt-0.5">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s*/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-2 flex flex-col gap-0.5 list-none">
          {listItems.map((item, j) => (
            <li key={j} className="flex gap-2 text-[12px] text-white/65">
              <span className="text-sky-400/60 shrink-0 w-4 text-right">{j + 1}.</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (trimmed === '') {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(<p key={i} className="text-[12px] text-white/65 leading-relaxed">{renderInline(trimmed)}</p>);
    }

    i++;
  }

  return elements;
}

// ─── Documents viewer ──────────────────────────────────────

function DocViewer() {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [selected, setSelected] = useState<DocFile | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [error, setError] = useState('');

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await DocsAPI.listDocs();
      setDocs(data);
    } catch {
      setError('ไม่สามารถโหลดรายการเอกสารได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const openDoc = async (doc: DocFile) => {
    setSelected(doc);
    setLoadingDoc(true);
    setContent('');
    try {
      const data = await DocsAPI.getDoc(doc.name);
      setContent(data.content);
    } catch {
      setContent('');
      setError('ไม่สามารถโหลดเอกสารได้');
    } finally {
      setLoadingDoc(false);
    }
  };

  const fmtSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;

  if (selected) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <button onClick={() => { setSelected(null); setContent(''); }}
            className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-sky-400 transition-colors">
            <ArrowLeft size={13} /> กลับ
          </button>
          <span className="text-white/20 text-[11px]">/</span>
          <span className="text-[12px] text-white/60 truncate">{selected.title}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingDoc ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-sky-400/25 border-t-sky-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="glass-card rounded-xl p-5">
              {renderMarkdown(content)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[16px] font-semibold text-white/85">เอกสารอ้างอิง</h3>
          <p className="text-[12px] text-white/35 mt-0.5">ไฟล์ Markdown จากโฟลเดอร์ MD</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-sky-400/25 border-t-sky-400 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <div className="text-[12px] text-red-400/80 mb-2">{error}</div>
          <button onClick={loadDocs} className="text-[11px] text-sky-400 hover:text-sky-300">ลองใหม่</button>
        </div>
      ) : docs.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-white/30">
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-[13px]">ไม่พบไฟล์ .md ในโฟลเดอร์</p>
          <p className="text-[11px] mt-1 text-white/20">กรุณาตรวจสอบ DOCS_PATH ใน server</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map(doc => (
            <button key={doc.name} onClick={() => openDoc(doc)}
              className="glass-card rounded-xl p-4 text-left hover:border-sky-500/25 hover:bg-white/[0.04] transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-sky-400/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-white/75 group-hover:text-white/90 transition-colors truncate">
                    {doc.title}
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">{fmtSize(doc.size)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KnowledgeBase() {
  const { kbArticles, currentUser, addKBArticle, deleteKBArticle, togglePinKBArticle, navigate } = useApp();

  const [view, setView] = useState<'articles' | 'docs'>('articles');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ทั้งหมด');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Add-article form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');

  const isIT = currentUser.role === 'it_staff' || currentUser.role === 'it_manager';

  const filtered = kbArticles.filter(a => {
    if (category !== 'ทั้งหมด' && a.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  // Pinned first in filtered list
  const sortedFiltered = [
    ...filtered.filter(a => a.pinned),
    ...filtered.filter(a => !a.pinned),
  ];

  const topArticles = [...kbArticles].sort((a, b) => b.views - a.views).slice(0, 3);
  const pinnedArticles = kbArticles.filter(a => a.pinned);

  const handleAdd = () => {
    if (!form.title.trim()) { setFormErr('กรุณาระบุชื่อบทความ'); return; }
    if (!form.summary.trim()) { setFormErr('กรุณาระบุสรุปบทความ'); return; }
    if (!form.content.trim()) { setFormErr('กรุณาระบุเนื้อหา'); return; }
    addKBArticle({
      title: form.title.trim(),
      category: form.category,
      summary: form.summary.trim(),
      content: form.content.trim(),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      author: currentUser.name,
    });
    setForm(EMPTY_FORM);
    setFormErr('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteKBArticle(id);
    setConfirmDeleteId(null);
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="module-content fade-in">
      {/* Add-article modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="glass rounded-2xl shadow-window w-[560px] max-h-[90vh] flex flex-col overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-blue-400" />
                <span className="text-[14px] font-semibold text-white/90">เพิ่มบทความใหม่</span>
              </div>
              <button onClick={() => { setShowForm(false); setFormErr(''); setForm(EMPTY_FORM); }}
                className="text-white/35 hover:text-white/70 transition-colors p-1 rounded-md">
                <X size={15} />
              </button>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">ชื่อบทความ *</label>
                  <input className="win-input text-[13px]" placeholder="เช่น วิธีแก้ Wi-Fi หลุดบ่อย"
                    value={form.title} onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFormErr(''); }} />
                </div>
                <div className="flex flex-col gap-1.5 w-[160px]">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">หมวดหมู่</label>
                  <select className="win-select text-[13px]" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase tracking-wider">สรุปสั้นๆ *</label>
                <textarea className="win-input text-[13px] resize-none" rows={2}
                  placeholder="อธิบายสั้นๆ ว่าบทความนี้ช่วยแก้ปัญหาอะไร"
                  value={form.summary} onChange={e => { setForm(f => ({ ...f, summary: e.target.value })); setFormErr(''); }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase tracking-wider">เนื้อหา * <span className="normal-case text-white/25">(รองรับ ## หัวข้อ, - รายการ, 1. ลำดับ)</span></label>
                <textarea className="win-input text-[13px] resize-none font-mono" rows={8}
                  placeholder={"## วิธีแก้ไข\n1. ขั้นตอนแรก\n2. ขั้นตอนที่สอง\n\n## หมายเหตุ\n- ข้อควรระวัง"}
                  value={form.content} onChange={e => { setForm(f => ({ ...f, content: e.target.value })); setFormErr(''); }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-white/40 uppercase tracking-wider">แท็ก <span className="normal-case text-white/25">(คั่นด้วยจุลภาค)</span></label>
                <input className="win-input text-[13px]" placeholder="wifi, อินเทอร์เน็ต, เครือข่าย"
                  value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              </div>
              {formErr && <p className="text-[11px] text-red-400">⚠ {formErr}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setShowForm(false); setFormErr(''); setForm(EMPTY_FORM); }}
                  className="win-btn-ghost flex-1 text-[13px]">ยกเลิก</button>
                <button onClick={handleAdd} className="win-btn flex-1 text-[13px] flex items-center justify-center gap-1.5">
                  <Plus size={13} /> บันทึกบทความ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[20px] font-semibold text-white/90">คลังความรู้ IT</h2>
          <p className="text-sm text-white/40 mt-0.5">แหล่งรวมบทความและคู่มือการแก้ปัญหาด้านไอที</p>
        </div>
        {view === 'articles' && isIT && (
          <button onClick={() => setShowForm(true)}
            className="win-btn flex items-center gap-1.5 text-[13px]">
            <Plus size={14} /> เพิ่มบทความ
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setView('articles')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
            view === 'articles'
              ? 'bg-blue-500/20 border border-blue-500/35 text-blue-300'
              : 'bg-white/[0.04] border border-white/[0.08] text-white/45 hover:text-white/65'
          }`}>
          <BookOpen size={13} /> บทความ IT
        </button>
        <button onClick={() => setView('docs')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
            view === 'docs'
              ? 'bg-sky-500/20 border border-sky-500/35 text-sky-300'
              : 'bg-white/[0.04] border border-white/[0.08] text-white/45 hover:text-white/65'
          }`}>
          <FileText size={13} /> เอกสารอ้างอิง
        </button>
      </div>

      {/* Documents view */}
      {view === 'docs' && <DocViewer />}

      {/* Articles view */}
      {view === 'articles' && <>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
        <input className="win-input pl-10 py-3 text-[14px] rounded-xl"
          placeholder="ค้นหาบทความ เช่น Wi-Fi, รหัสผ่าน, VPN..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORY_FILTER.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
              category === cat
                ? 'bg-blue-500/25 border border-blue-500/40 text-blue-300'
                : 'bg-white/05 border border-white/10 text-white/50 hover:bg-white/08 hover:text-white/70'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Articles list */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-white/40 uppercase tracking-wider">
              บทความ {filtered.length} รายการ{search ? ` · ค้นหา "${search}"` : ''}
            </span>
          </div>

          {sortedFiltered.length === 0 ? (
            <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-white/30">
              <BookOpen size={36} className="mb-3 opacity-40" />
              <p className="text-sm">ไม่พบบทความที่ตรงกับการค้นหา</p>
              <button onClick={() => { setSearch(''); setCategory('ทั้งหมด'); }}
                className="mt-3 text-xs text-blue-400/70 hover:text-blue-400">ล้างการค้นหา</button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedFiltered.map(article => {
                const isExpanded = expandedId === article.id;
                const isConfirmingDelete = confirmDeleteId === article.id;
                return (
                  <div key={article.id} className={`glass-card rounded-xl overflow-hidden transition-all ${article.pinned ? 'border border-amber-500/20' : ''}`}>
                    <div className="flex items-stretch">
                      {/* Pin indicator strip */}
                      {article.pinned && (
                        <div className="w-1 bg-amber-500/50 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : article.id)}
                          className="w-full text-left p-4 hover:bg-white/03 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {article.pinned && (
                                  <span className="flex items-center gap-1 text-[10px] bg-amber-500/15 border border-amber-500/25 text-amber-300 px-2 py-0.5 rounded-full">
                                    <Pin size={9} /> ปัญหาที่พบบ่อย
                                  </span>
                                )}
                                <span className="text-[10px] bg-blue-500/15 border border-blue-500/25 text-blue-300 px-2 py-0.5 rounded-full">
                                  {article.category}
                                </span>
                                <div className="flex items-center gap-3 text-[10px] text-white/30">
                                  <span className="flex items-center gap-1"><Eye size={10} /> {article.views.toLocaleString()}</span>
                                  <span className="flex items-center gap-1"><ThumbsUp size={10} /> {article.helpful}</span>
                                </div>
                              </div>
                              <h3 className="text-[14px] font-medium text-white/85 leading-snug">{article.title}</h3>
                              <p className="text-[12px] text-white/45 mt-1 leading-relaxed">{article.summary}</p>
                            </div>
                            <div className="shrink-0 mt-1">
                              {isExpanded ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {article.tags.map(tag => (
                              <span key={tag} className="flex items-center gap-1 text-[10px] text-white/30 bg-white/04 px-1.5 py-0.5 rounded border border-white/07">
                                <Tag size={8} /> {tag}
                              </span>
                            ))}
                          </div>
                        </button>

                        {/* IT action bar */}
                        {isIT && (
                          <div className="flex items-center justify-between px-4 pb-2.5 -mt-1">
                            <button
                              onClick={() => togglePinKBArticle(article.id)}
                              className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                                article.pinned
                                  ? 'text-amber-400 hover:text-amber-300'
                                  : 'text-white/25 hover:text-amber-400'
                              }`}
                              title={article.pinned ? 'ถอดหมุด' : 'ปักหมุดเป็นปัญหาที่พบบ่อย'}
                            >
                              {article.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                              {article.pinned ? 'ถอดหมุด' : 'ปักหมุด'}
                            </button>

                            {isConfirmingDelete ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-white/40 flex items-center gap-1">
                                  <AlertTriangle size={11} className="text-red-400" /> ยืนยันลบ?
                                </span>
                                <button onClick={() => handleDelete(article.id)}
                                  className="text-[11px] text-red-400 hover:text-red-300 px-2 py-0.5 rounded border border-red-500/30 hover:border-red-500/50 transition-colors">
                                  ลบ
                                </button>
                                <button onClick={() => setConfirmDeleteId(null)}
                                  className="text-[11px] text-white/35 hover:text-white/60 transition-colors">
                                  ยกเลิก
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(article.id)}
                                className="flex items-center gap-1 text-[11px] text-white/20 hover:text-red-400 transition-colors"
                                title="ลบบทความ"
                              >
                                <Trash2 size={12} /> ลบ
                              </button>
                            )}
                          </div>
                        )}

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 border-t border-white/06 fade-in">
                            <div className="prose-sm text-white/65 leading-relaxed text-[13px] pt-3">
                              {renderContent(article.content)}
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/06">
                              <div className="text-[10px] text-white/30">
                                อัปเดต {formatDate(article.updatedAt)} · โดย {article.author}
                              </div>
                              <button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-green-400 transition-colors">
                                <ThumbsUp size={12} /> มีประโยชน์
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Pinned articles */}
          {pinnedArticles.length > 0 && (
            <div className="glass-card rounded-xl p-4 border border-amber-500/15">
              <div className="flex items-center gap-1.5 mb-3">
                <Pin size={12} className="text-amber-400" />
                <span className="text-[11px] font-semibold text-amber-300/80 uppercase tracking-wider">ปัญหาที่พบบ่อย</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {pinnedArticles.map(a => (
                  <button key={a.id}
                    onClick={() => { setExpandedId(a.id); setSearch(''); setCategory('ทั้งหมด'); }}
                    className="text-left flex items-start gap-2 hover:bg-white/04 rounded-lg p-1.5 -mx-1.5 transition-colors">
                    <Pin size={10} className="text-amber-400/60 shrink-0 mt-1" />
                    <span className="text-[12px] text-white/70 leading-snug">{a.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top articles */}
          <div className="glass-card rounded-xl p-4">
            <div className="section-title">บทความยอดนิยม</div>
            <div className="flex flex-col gap-3">
              {topArticles.map((a, i) => (
                <button key={a.id}
                  onClick={() => { setExpandedId(a.id); setSearch(''); setCategory('ทั้งหมด'); }}
                  className="text-left flex items-start gap-2.5 hover:bg-white/04 rounded-lg p-2 -m-2 transition-colors">
                  <span className="text-[16px] font-light text-white/20 w-5 shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <div className="text-[12px] text-white/70 leading-snug">{a.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/30">
                      <Eye size={9} /> {a.views.toLocaleString()} views
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Need help */}
          <div className="glass-card rounded-xl p-4 border border-blue-500/15">
            <div className="section-title">ไม่พบคำตอบ?</div>
            <p className="text-[12px] text-white/50 mb-3 leading-relaxed">
              ถ้าไม่พบบทความที่ช่วยได้ ให้แจ้งปัญหาผ่านระบบ IT Helpdesk ทีมงานจะช่วยเหลือโดยตรง
            </p>
            <button onClick={() => navigate('submit_ticket')} className="win-btn w-full text-sm">
              แจ้งปัญหา IT
            </button>
          </div>
        </div>
      </div>
      </>}
    </div>
  );
}
