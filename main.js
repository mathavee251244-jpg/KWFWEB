/* ═══════════════════════════════════════════
   KINGWELL FIRST — MAIN.JS  (Shared)
═══════════════════════════════════════════ */
'use strict';

// Prevent browser from restoring scroll position on page load
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ─── PAGE TRANSITION (coin flip) ─── COMMENTED OUT for timing test ───
/*
(function(){
  const pt = document.createElement('div');
  pt.id = 'page-transition';
  pt.innerHTML =
    '<img class="pt-logo" src="assets/LOGO_BKSF.png" alt="BANGKOK SEAFOOD">' +
    '<span class="pt-label">Bangkok Seafood</span>';
  document.body.appendChild(pt);

  document.addEventListener('click', function(e){
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || a.target === '_blank') return;
    e.preventDefault();
    pt.classList.add('show');
    setTimeout(function(){ window.location.href = href; }, 680);
  }, true);
})();
*/

// ─── LOADER ──────────────────────────────
const loader    = document.getElementById('loader');
const loaderBar = document.getElementById('loaderProgress');
if (loader) {
  let p = 0;
  const iv = setInterval(() => {
    p += Math.random() * 18;
    if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => loader.classList.add('hidden'), 300); }
    loaderBar.style.width = p + '%';
  }, 60);
}

// ─── THEME ───────────────────────────────
const html        = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
html.setAttribute('data-theme', localStorage.getItem('kwf-theme') || 'light');
themeToggle?.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('kwf-theme', next);
});

// ─── LANGUAGE ────────────────────────────
const langBtn = document.getElementById('langBtn');
let isEn = localStorage.getItem('kwf-lang') === 'en';

const FLAG_TH = `<svg width="22" height="15" viewBox="0 0 22 15" xmlns="http://www.w3.org/2000/svg">
  <rect width="22" height="15" fill="#A51931"/>
  <rect y="2.5" width="22" height="10" fill="#F4F5F8"/>
  <rect y="5.5" width="22" height="4" fill="#2D2A4A"/>
</svg>`;

const FLAG_EN = `<svg width="22" height="15" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg">
  <rect width="60" height="40" fill="#012169"/>
  <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" stroke-width="8"/>
  <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" stroke-width="5"/>
  <path d="M30,0 V40 M0,20 H60" stroke="#fff" stroke-width="12"/>
  <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" stroke-width="7"/>
</svg>`;

function renderLangBtn() {
  if (!langBtn) return;
  langBtn.innerHTML = isEn
    ? `${FLAG_TH}<span>TH</span>`
    : `${FLAG_EN}<span>EN</span>`;
}

const SPEC_DICT = {
  // ── Labels ──
  'แหล่งกำเนิด':'Origin',
  'ผลิตภัณฑ์':'Product Type',
  'รูปแบบ':'Form',
  'บรรจุภัณฑ์':'Packaging',
  'มาตรฐาน':'Certifications',
  'น้ำหนัก':'Weight',
  'ขนาด':'Size',
  'อายุการเก็บ':'Shelf Life',
  'อายุการเก็บรักษา':'Shelf Life',
  'อุณหภูมิ':'Temperature',
  'สายพันธุ์':'Species',
  'ลักษณะ':'Description',
  'วิธีปรุง':'Cooking Method',
  'วัตถุดิบ':'Ingredients',
  // ── Origins ──
  'ประเทศไทย':'Thailand',
  'นอร์เวย์ / ชิลี':'Norway / Chile',
  'อลาสก้า สหรัฐอเมริกา / รัสเซีย':'Alaska, USA / Russia',
  'อลาสก้า สหรัฐอเมริกา':'Alaska, USA',
  'กรีนแลนด์ / นอร์เวย์':'Greenland / Norway',
  'ไอซ์แลนด์ / นอร์เวย์':'Iceland / Norway',
  // ── Product types ──
  'เนื้อปลาแล่ (Fillet), คิริมิ, เนื้อส่วนสันใน (Loin)':'Fillet, Kirimi, Loin',
  'เนื้อปลาแล่, คิริมิ, เนื้อส่วนสันใน':'Fillet, Kirimi, Loin',
  'เนื้อปลาแล่, เนื้อหั่นชิ้น (Portion)':'Fillet, Portion',
  'เนื้อปลาแล่, คิริมิ, เนื้อหั่นชิ้น':'Fillet, Kirimi, Portion',
  'เนื้อปลาแล่ (Fillet), คิริมิ':'Fillet, Kirimi',
  'เนื้อปลาแล่, คิริมิ, แบบทั้งตัว':'Fillet, Kirimi, Whole',
  'เนื้อหาง, เนื้อส่วนสันใน, เนื้อบด (Minced)':'Tail, Loin, Minced',
  'เนื้อปลาแล่, เนื้อหั่นชิ้น, แบบทั้งตัว':'Fillet, Portion, Whole',
  'ทั้งตัว, เฉพาะเนื้อ, หนวด, วงหมึก':'Whole, Tube, Tentacles, Rings',
  'ทำความสะอาดทั้งตัว, เนื้อเต็มตัว':'Whole Cleaned, Full Body',
  'ทั้งตัว, หั่นชิ้น, สไตล์เกาหลี':'Whole, Cut, Korean Style',
  // ── Form ──
  'IQF / แบบบล็อก':'IQF / Block',
  // ── Packaging ──
  'IVP, IWP, ถุงสีสำหรับขายปลีก':'IVP, IWP, Retail Bags',
  'IVP, IWP, ถุงขายปลีก':'IVP, IWP, Retail Bags',
  // ── Shelf life ──
  '24 เดือน ที่ -18°C':'24 months at -18°C',
  '18 เดือน ที่ -18°C':'18 months at -18°C',
  // ── Processed / Ready ──
  'ชุบเกล็ดขนมปังพรีเมียม':'Premium Breadcrumb Coated',
  'ทอดในน้ำมันร้อน 180°C, 3–5 นาที':'Deep fry at 180°C for 3–5 min',
  'ทอดในน้ำมันร้อน 180°C, 3–4 นาที':'Deep fry at 180°C for 3–4 min',
  'ทอดในน้ำมันร้อน 180°C, 4–6 นาที':'Deep fry at 180°C for 4–6 min',
  'เนื้อปลาขาว (Pollock / Cod)':'White Fish (Pollock / Cod)',
  'ชุบเกล็ดขนมปัง / Pre-Fried':'Breadcrumbed / Pre-Fried',
  'ทอด, อบ, หรืออุ่นในไมโครเวฟ':'Fry, Bake, or Microwave',
  'เนื้อปลาขาว คุณภาพสูง':'Premium White Fish',
  'คลุกแป้งบาง ไม่ชุบไข่':'Thin Flour Coated, No Egg Wash',
  'เนื้อปลาขาว + มันฝรั่ง':'White Fish + Potato',
  'ทอดสำเร็จรูปพร้อมอุ่น':'Pre-Fried, Ready to Heat',
  'Air Fryer 180°C, 5 นาที หรือไมโครเวฟ':'Air Fryer 180°C, 5 min or Microwave',
  'เนื้อปลาค็อด (Pollock/Cod)':'Cod Fish (Pollock/Cod)',
  'ชุบแป้งทอดสำเร็จรูป':'Ready-Battered, Pre-Fried',
  'Air Fryer หรือเตาอบ 180°C, 5 นาที':'Air Fryer or Oven 180°C, 5 min',
  // ── Fish Skin / Snack ──
  'หนังปลาธรรมชาติ':'Natural Fish Skin',
  'ทอดกรอบ / Puffed':'Crispy Fried / Puffed',
  'พลังงาน':'Nutrition',
  'โปรตีนสูง ไขมันต่ำ':'High Protein, Low Fat',
  // ── Kroops brand ──
  'แบรนด์':'Brand',
  'รสชาติ':'Flavor',
  'ทรัฟเฟิล (Truffle Flavor)':'Truffle Flavor',
  'ช่องทางจำหน่าย':'Distribution',
  '7-Eleven ทั่วประเทศ':'7-Eleven Nationwide',
};

function applyLang() {
  document.querySelectorAll('[data-en]').forEach(el => {
    if (isEn) {
      el._th = el._th || el.innerHTML;
      el.innerHTML = el.getAttribute('data-en');
    } else {
      if (el._th) el.innerHTML = el._th;
    }
  });
  // switch placeholder text
  document.querySelectorAll('[data-en-placeholder]').forEach(el => {
    if (isEn) {
      el._thPh = el._thPh || el.placeholder;
      el.placeholder = el.getAttribute('data-en-placeholder');
    } else {
      if (el._thPh) el.placeholder = el._thPh;
    }
  });
  // translate ALL spec table cells (labels + values)
  document.querySelectorAll('.spec-table td, .drawer-spec-table td, .product-spec-preview td').forEach(td => {
    const txt = td.textContent.trim();
    if (isEn && SPEC_DICT[txt]) { td._th = txt; td.textContent = SPEC_DICT[txt]; }
    else if (!isEn && td._th)   { td.textContent = td._th; td._th = null; }
  });
  renderLangBtn();
}

applyLang();

langBtn?.addEventListener('click', () => {
  isEn = !isEn;
  localStorage.setItem('kwf-lang', isEn ? 'en' : 'th');
  applyLang();
});

// ─── CURSOR ──────────────────────────────
const cursor   = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  if (cursor) { cursor.style.left = mx + 'px'; cursor.style.top = my + 'px'; }
});
(function animCursor() {
  fx += (mx - fx) * 0.12; fy += (my - fy) * 0.12;
  if (follower) { follower.style.left = fx + 'px'; follower.style.top = fy + 'px'; }
  requestAnimationFrame(animCursor);
})();

// ─── NAVBAR ──────────────────────────────
const navbar      = document.getElementById('navbar');
const navProgress = document.getElementById('navProgress');
const backToTop   = document.getElementById('backToTop');
const hamburger   = document.getElementById('hamburger');
const navLinks    = document.getElementById('navLinks');

let lastSy = 0;

function resetNavbar() {
  window.scrollTo(0, 0);
  navbar?.classList.remove('nav-hidden');
  lastSy = 0;
}

// bfcache restore (back/forward button) — scripts don't re-run in bfcache
window.addEventListener('pageshow', e => { if (e.persisted) resetNavbar(); });
// belt-and-suspenders: also reset on load in case scrollRestoration fired late
window.addEventListener('load', resetNavbar);

window.addEventListener('scroll', () => {
  const sy  = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  navbar?.classList.toggle('scrolled', sy > 60);
  navbar?.classList.toggle('nav-hidden', sy > 120 && sy > lastSy);
  lastSy = sy;
  if (navProgress) navProgress.style.width = (sy / max * 100) + '%';
  backToTop?.classList.toggle('visible', sy > 400);
}, { passive: true });

backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks?.classList.toggle('open');
});
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  hamburger?.classList.remove('open');
  navLinks.classList.remove('open');
}));

// Active nav link — highlight by current page filename
(function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page || (page === '' || page === 'index.html') && href === 'index.html') {
      a.classList.add('active');
    }
  });
})();

// ─── SCROLL REVEAL ───────────────────────
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const delay = parseInt(e.target.getAttribute('data-delay') || 0);
    setTimeout(() => e.target.classList.add('visible'), delay);
    revObs.unobserve(e.target);
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal-up,.reveal-left,.reveal-right').forEach(el => revObs.observe(el));

// ─── COUNTER ─────────────────────────────
const cntObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el  = e.target;
    const tgt = parseInt(el.getAttribute('data-target'));
    const sfx = el.getAttribute('data-suffix') || '';
    let cur = 0;
    const step = tgt / (2000 / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= tgt) { cur = tgt; clearInterval(t); }
      el.textContent = Math.floor(cur).toLocaleString() + sfx;
    }, 16);
    cntObs.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-number,.stat-num').forEach(el => cntObs.observe(el));

// ─── PRODUCT SPEC PREVIEW ────────────────
document.querySelectorAll('.product-card').forEach(card => {
  const specEl = card.querySelector('.product-spec table');
  const info   = card.querySelector('.product-info');
  if (!specEl || !info) return;
  const rows = [...specEl.querySelectorAll('tr')].slice(0,2);
  if (!rows.length) return;
  const preview = document.createElement('div');
  preview.className = 'product-spec-preview';
  const tbl = document.createElement('table');
  rows.forEach(r => {
    const cells = r.querySelectorAll('td');
    if (cells.length < 2) return;
    const tr = document.createElement('tr');
    const td0 = document.createElement('td');
    const td1 = document.createElement('td');
    td0.textContent = cells[0].textContent;
    td1.textContent = cells[1].textContent;
    tr.appendChild(td0);
    tr.appendChild(td1);
    tbl.appendChild(tr);
  });
  preview.appendChild(tbl);
  info.appendChild(preview);
  // apply current language to newly created preview
  if (isEn) {
    preview.querySelectorAll('td').forEach(td => {
      const txt = td.textContent.trim();
      if (SPEC_DICT[txt]) { td._th = txt; td.textContent = SPEC_DICT[txt]; }
    });
  }
});

// ─── PRODUCT FILTER ──────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.getAttribute('data-filter');
    document.querySelectorAll('.product-card').forEach(card => {
      const show = f === 'all' || card.getAttribute('data-category') === f;
      card.style.transition = 'opacity .3s,transform .3s';
      if (show) {
        card.classList.remove('hidden');
        requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = ''; });
      } else {
        card.style.opacity = '0'; card.style.transform = 'scale(.9)';
        setTimeout(() => card.classList.add('hidden'), 300);
      }
    });
  });
});

// ─── BUBBLES CANVAS ──────────────────────
const canvas = document.getElementById('bubblesCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
  resize(); window.addEventListener('resize', resize);
  const B = Array.from({ length: 40 }, () => ({
    x: Math.random() * canvas.width, y: Math.random() * canvas.height,
    r: Math.random() * 4 + 1, vx: (Math.random() - .5) * .4,
    vy: -Math.random() * .5 - .2, a: Math.random() * .4 + .1,
  }));
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const c = html.getAttribute('data-theme') === 'dark' ? '0,212,255' : '0,100,200';
    B.forEach(b => {
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c},${b.a})`; ctx.fill();
      b.x += b.vx; b.y += b.vy;
      if (b.y < -10) { b.y = canvas.height + 10; b.x = Math.random() * canvas.width; }
      if (b.x < 0 || b.x > canvas.width) b.vx *= -1;
    });
    requestAnimationFrame(draw);
  })();
}

// ─── HERO PARALLAX ───────────────────────
const floatCards = document.querySelectorAll('.float-card');
document.addEventListener('mousemove', e => {
  const cx = innerWidth / 2, cy = innerHeight / 2;
  const dx = (e.clientX - cx) / cx, dy = (e.clientY - cy) / cy;
  floatCards.forEach((c, i) => {
    const d = (i + 1) * 8;
    c.style.transform = `translate(${dx * d}px,${dy * d}px)`;
  });
});

// ─── HERO TITLE ENTRANCE ─────────────────
document.querySelectorAll('.title-line').forEach((line, i) => {
  line.style.cssText = `opacity:0;transform:translateY(30px);transition:opacity .6s ease ${.3 + i * .15}s,transform .6s ease ${.3 + i * .15}s`;
  setTimeout(() => { line.style.opacity = '1'; line.style.transform = 'none'; }, 500 + i * 150);
});

// ─── TILT CARDS ──────────────────────────
document.querySelectorAll('.product-card,.service-card,.cert-card,.team-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const tx = ((y - r.height / 2) / r.height) * -8;
    const ty = ((x - r.width  / 2) / r.width)  *  8;
    card.style.transform = `perspective(600px) rotateX(${tx}deg) rotateY(${ty}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => card.style.transform = '');
});

// ─── RIPPLE ──────────────────────────────
const rippleStyle = document.createElement('style');
rippleStyle.textContent = '@keyframes ripple{to{transform:scale(2.5);opacity:0}}';
document.head.appendChild(rippleStyle);
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const r = this.getBoundingClientRect();
    const s = Math.max(r.width, r.height);
    const span = document.createElement('span');
    span.style.cssText = `position:absolute;border-radius:50%;width:${s}px;height:${s}px;left:${e.clientX - r.left - s/2}px;top:${e.clientY - r.top - s/2}px;background:rgba(255,255,255,.25);transform:scale(0);animation:ripple .6s linear;pointer-events:none`;
    this.appendChild(span);
    setTimeout(() => span.remove(), 600);
  });
});

// ─── HERO PARTICLES ──────────────────────
(function createParticles() {
  const c = document.getElementById('heroParticles');
  if (!c) return;
  c.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1';
  const ks = document.createElement('style');
  ks.textContent = `@keyframes pf{0%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,-20px) scale(1.4)}100%{transform:translate(-20px,10px) scale(.7)}}`;
  document.head.appendChild(ks);
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    const sz = Math.random() * 4 + 1;
    p.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;background:var(--accent);border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*100}%;opacity:${Math.random()*.25+.05};animation:pf ${Math.random()*10+8}s ease-in-out infinite ${Math.random()*5}s alternate;pointer-events:none`;
    c.appendChild(p);
  }
})();

// ─── CONTACT FORM ────────────────────────
const contactForm = document.getElementById('contactForm');
const toast       = document.getElementById('toast');
contactForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = contactForm.querySelector('.btn-primary');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span>กำลังส่ง...</span>'; btn.disabled = true;
  try {
    const inputs = contactForm.querySelectorAll('input, select, textarea');
    const data = {
      name:    inputs[0].value.trim(),
      email:   inputs[1].value.trim(),
      company: inputs[2].value.trim() || null,
      subject: inputs[3].value,
      message: inputs[4].value.trim()
    };
    if (typeof window.saveContactToFirestore === 'function')
      window.saveContactToFirestore(data).catch(err => console.error('Firestore:', err));
    if (typeof window.sendContactEmail === 'function')
      await window.sendContactEmail();
    contactForm.reset();
    if (toast) {
      toast.classList.add('show');
      const hide = () => toast.classList.remove('show');
      setTimeout(hide, 3500);
      toast.addEventListener('click', hide, { once: true });
    }
  } catch (err) {
    console.error('Contact form error:', err?.status, err?.text, err);
    alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
  } finally {
    btn.innerHTML = orig; btn.disabled = false;
  }
});

// ─── PRODUCT DRAWER ──────────────────────
const productDrawer = document.getElementById('productDrawer');
if (productDrawer) {
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const drawerClose    = document.getElementById('drawerClose');
  const drawerImg      = document.getElementById('drawerImg');
  const drawerImgTag   = document.getElementById('drawerImgTag');
  const drawerImgTitle = document.getElementById('drawerImgTitle');
  const drawerCat      = document.getElementById('drawerCat');
  const drawerTitle    = document.getElementById('drawerTitle');
  const drawerDesc     = document.getElementById('drawerDesc');
  const drawerTags     = document.getElementById('drawerTags');
  const drawerSpecBody = document.querySelector('#drawerSpec tbody');

  const catLabels = { fish:'ปลา', shrimp:'กุ้ง', squid:'ปลาหมึก', ready:'พร้อมทาน' };

  function openDrawer(card) {
    const img    = card.querySelector('.product-img-bg img');
    const tagsEl = card.querySelector('.product-tags');
    const specEl = card.querySelector('.product-spec');
    const name   = card.querySelector('h3')?.textContent || '';
    const desc   = card.querySelector('p')?.textContent  || '';
    const cat    = card.getAttribute('data-category')    || '';

    drawerImg.src = img?.src || '';
    drawerImg.alt = name;
    drawerImgTag.textContent   = 'Bangkok Seafood';
    drawerImgTitle.textContent = name;
    drawerCat.textContent      = catLabels[cat] || 'ผลิตภัณฑ์';
    drawerTitle.textContent    = name;
    drawerDesc.textContent     = desc;

    drawerTags.innerHTML = tagsEl ? tagsEl.innerHTML : '';
    drawerSpecBody.innerHTML = '';
    if (specEl) {
      [...specEl.querySelectorAll('tr')]
        .filter(r => r.querySelectorAll('td').length === 2)
        .forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${r.cells[0].textContent}</td><td>${r.cells[1].textContent}</td>`;
          drawerSpecBody.appendChild(tr);
        });
    }

    productDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    productDrawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => openDrawer(card));
  });
  document.querySelectorAll('.product-quick-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openDrawer(btn.closest('.product-card')); });
  });

  drawerClose?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
}

// ─── MODAL (gallery lightbox) ─────────────
const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const modalTitle   = document.getElementById('modalTitle');
const modalBody    = document.getElementById('modalBody');
modalClose?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
function closeModal() {
  modalOverlay?.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── GALLERY LIGHTBOX (About page) ───────
document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const emoji = item.querySelector('.gallery-emoji')?.textContent || '🖼️';
    const cap   = item.querySelector('.gallery-caption')?.textContent || '';
    if (!modalOverlay) return;
    modalTitle.textContent = cap;
    modalBody.innerHTML = `<div style="font-size:8rem;text-align:center;padding:32px">${emoji}</div>
      <p style="color:var(--text-3);text-align:center;font-size:.9rem">
        <!-- [รูปภาพ] ใส่รูปภาพขนาดเต็มใน lightbox นี้ -->
      </p>`;
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});

// ─── SMOOTH SECTION HIGHLIGHT ────────────
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const id = e.target.getAttribute('id');
    document.querySelectorAll('.nav-link').forEach(a => {
      a.style.color = '';
      if (a.getAttribute('href') === `#${id}`) a.style.color = 'var(--accent)';
    });
  });
}, { threshold: 0.4 });
document.querySelectorAll('section[id]').forEach(s => sectionObs.observe(s));
