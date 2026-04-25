/* ═══════════════════════════════════════════
   KINGWELL FIRST — MAIN.JS  (Shared)
═══════════════════════════════════════════ */
'use strict';

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
html.setAttribute('data-theme', localStorage.getItem('kwf-theme') || 'dark');
themeToggle?.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('kwf-theme', next);
});

// ─── LANGUAGE ────────────────────────────
const langBtn = document.getElementById('langBtn');
let isEn = false;
langBtn?.addEventListener('click', () => {
  isEn = !isEn;
  langBtn.textContent = isEn ? 'TH' : 'EN';
  document.querySelectorAll('[data-en]').forEach(el => {
    if (isEn) {
      el._th = el._th || el.innerHTML;
      el.innerHTML = el.getAttribute('data-en');
    } else {
      if (el._th) el.innerHTML = el._th;
    }
  });
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

window.addEventListener('scroll', () => {
  const sy  = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  navbar?.classList.toggle('scrolled', sy > 60);
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
document.querySelectorAll('.stat-number').forEach(el => cntObs.observe(el));

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
contactForm?.addEventListener('submit', e => {
  e.preventDefault();
  const btn = contactForm.querySelector('.btn-primary');
  const orig = btn.innerHTML;
  btn.innerHTML = '<span>กำลังส่ง...</span>'; btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = orig; btn.disabled = false;
    contactForm.reset();
    if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 4000); }
  }, 1500);
});

// ─── PRODUCT MODAL ───────────────────────
const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const modalTitle   = document.getElementById('modalTitle');
const modalBody    = document.getElementById('modalBody');

document.querySelectorAll('.product-quick-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const card = btn.closest('.product-card');
    if (!modalOverlay) return;
    modalTitle.textContent = card.querySelector('h3').textContent;
    modalBody.innerHTML = `
      <div style="font-size:5rem;text-align:center;margin-bottom:16px">${card.querySelector('.product-emoji').textContent}</div>
      <p style="color:var(--text-2);margin-bottom:16px;line-height:1.8">${card.querySelector('p').textContent}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px">${card.querySelector('.product-tags').innerHTML}</div>
      <a href="contact.html" class="btn btn-primary btn-full">สอบถามราคา / สั่งซื้อ
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>`;
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
});
modalClose?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
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
