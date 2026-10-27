'use strict';

/* ===== Helpers ===== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// localStorage can be blocked (e.g. private mode), so every access is guarded
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, val) { try { localStorage.setItem(key, val); } catch { /* ignore */ } }
};

/* ===== Data: project cards are built from this array ===== */
// `type` is used by the filter buttons. Add `img` and `alt` for a screenshot, and `link` for GitHub or a live demo.
const PROJECTS = [
  { title: 'Sarawak Lokal Marketplace', type: 'Web',
    tags: ['Web application', 'UI design', 'UML', 'Project planning'],
    desc: 'A digital marketplace that helps local Sarawak businesses promote and sell their products online.',
    details: 'I designed the user interface, created the marketplace workflow, and wrote the system documentation, including use case diagrams and the project plan.',
    link: '', img: '', alt: '' },
  { title: 'Student Management System', type: 'Desktop',
    tags: ['Desktop application', 'Records', 'Data storage'],
    desc: 'A system that manages and organises student information efficiently.',
    details: 'I developed the functions for student registration, record management and data storage.',
    link: '', img: '', alt: '' },
  { title: 'Network Security Implementation', type: 'Networking',
    tags: ['Network security', 'VLANs', 'Access control'],
    desc: 'Basic network security measures implemented in a simulated environment.',
    details: 'I configured VLANs, access control policies and security settings to improve network protection.',
    link: '', img: '', alt: '' },
  { title: 'Personal Portfolio Website', type: 'Web',
    tags: ['Web application', 'HTML', 'CSS', 'JavaScript'],
    desc: 'This website: a responsive portfolio built from scratch with no frameworks.',
    details: 'Built with plain HTML, CSS and JavaScript. It has a responsive layout, accessible navigation, a dark mode and a validated contact form.',
    link: '', img: '', alt: '' },
  // TODO: replace this planned project with a finished one before you submit
  { title: 'Subnet Calculator', type: 'Networking',
    tags: ['Web application', 'JavaScript', 'Subnetting'],
    desc: 'Planned next: a JavaScript tool that calculates subnets for networking practice.',
    details: 'In progress. Details will be added once the project is finished.',
    link: '', img: '', alt: '' }
];

/* ===== 1. Theme toggle (remembers the choice) ===== */
function initTheme() {
  const btn = $('#themeBtn');
  const root = document.documentElement;
  const apply = (theme) => {
    root.dataset.theme = theme;
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  };
  apply(root.dataset.theme || 'light');
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    apply(next);
    store.set('theme', next);
  });
}

/* ===== 2. Mobile menu (closes on Escape or link click) ===== */
function initMenu() {
  const btn = $('#menuBtn');
  const list = $('#navLinks');
  const setOpen = (open) => {
    list.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => setOpen(!list.classList.contains('open')));
  list.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && list.classList.contains('open')) { setOpen(false); btn.focus(); }
  });
}

/* ===== 3. Highlight the current section in the nav ===== */
function initActiveNav() {
  const links = $$('#navLinks a');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => {
        const active = a.hash === `#${entry.target.id}`;
        a.classList.toggle('active', active);
        if (active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const section = $(a.hash); if (section) observer.observe(section); });
}

/* ===== 4. Render project cards from data ===== */
function projectCard(p, i) {
  const image = p.img ? `<img src="${p.img}" alt="${p.alt}" loading="lazy">` : '';
  return `<article class="card" data-type="${p.type}">
      ${image}
      <h3>${p.title}</h3>
      <p>${p.desc}</p>
      <ul class="tags">${p.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
      <button class="btn" type="button" data-index="${i}" aria-haspopup="dialog">View details<span class="sr-only"> for ${p.title}</span></button>
    </article>`;
}
function renderProjects() {
  $('#projectGrid').innerHTML = PROJECTS.map(projectCard).join('');
}

/* ===== 5. Filter projects by type ===== */
function initFilters() {
  const chips = $$('.chip');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    $$('.card').forEach((card) => {
      card.hidden = chip.dataset.filter !== 'all' && card.dataset.type !== chip.dataset.filter;
    });
  }));
}

/* ===== 6. Project details modal (native <dialog> handles Esc and focus) ===== */
function initModal() {
  const modal = $('#modal');
  const open = (i) => {
    const p = PROJECTS[i];
    $('#modalTitle').textContent = p.title;
    $('#modalBody').textContent = p.details;
    $('#modalTags').innerHTML = p.tags.map((t) => `<li>${t}</li>`).join('');
    const link = $('#modalLink');
    link.hidden = !p.link; // only show the button if the project has a link
    if (p.link) link.href = p.link;
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  };
  const close = () => (typeof modal.close === 'function' ? modal.close() : modal.removeAttribute('open'));
  $('#projectGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-index]');
    if (btn) open(Number(btn.dataset.index));
  });
  $('#modalClose').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); }); // click on backdrop
}

/* ===== 7. Fill skill bars when they scroll into view ===== */
function initSkillBars() {
  const skills = $('.skills');
  if (!('IntersectionObserver' in window)) { skills.classList.add('in'); return; }
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { skills.classList.add('in'); observer.disconnect(); }
  }, { threshold: 0.2 });
  observer.observe(skills);
}

/* ===== 8 + 9. Scroll progress bar and back-to-top button ===== */
function initScrollUI() {
  const bar = $('#progress');
  const toTop = $('#toTop');
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    toTop.hidden = scrollY < 500;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
  update();
}

/* ===== 10 + 11. Contact form: live validation and character counter (front-end only) ===== */
function initForm() {
  const form = $('#contactForm');
  const status = $('#formStatus');
  const rules = {
    name: (v) => v.trim().length >= 2 || 'Enter your name (at least 2 characters).',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address, like name@example.com.',
    message: (v) => v.trim().length >= 10 || 'Write a message of at least 10 characters.'
  };
  const validate = (field) => {
    const result = rules[field.name](field.value);
    const ok = result === true;
    field.setAttribute('aria-invalid', String(!ok));
    $(`#${field.id}Err`).textContent = ok ? '' : result;
    return ok;
  };
  const fields = $$('input, textarea', form);
  fields.forEach((f) => f.addEventListener('blur', () => validate(f)));

  const message = $('#message');
  message.addEventListener('input', () => { $('#count').textContent = `${message.value.length}/${message.maxLength}`; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const results = fields.map(validate); // validate all fields so every error shows at once
    if (results.includes(false)) {
      status.textContent = 'Please fix the highlighted fields.';
      fields[results.indexOf(false)].focus();
      return;
    }
    const to = $('#emailLink').textContent.trim();
    const subject = encodeURIComponent(`Portfolio message from ${form.name.value}`);
    const body = encodeURIComponent(`${form.message.value}\n\nFrom: ${form.name.value} (${form.email.value})`);
    location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    status.textContent = 'Thanks! Your email app should open with the message ready to send.';
    form.reset();
    $('#count').textContent = `0/${message.maxLength}`;
  });
}

/* ===== 12. Copy email to clipboard ===== */
function initCopyEmail() {
  const status = $('#copyStatus');
  $('#copyBtn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('#emailLink').textContent.trim());
      status.textContent = 'Email address copied.';
    } catch {
      status.textContent = 'Copy failed. Please select the address and copy it manually.';
    }
  });
}

/* ===== 13. Footer year ===== */
function initYear() { $('#year').textContent = new Date().getFullYear(); }

/* ===== Start: each feature runs in its own try/catch so one failure never breaks the page ===== */
document.addEventListener('DOMContentLoaded', () => {
  renderProjects();
  [initTheme, initMenu, initActiveNav, initFilters, initModal, initSkillBars,
    initScrollUI, initForm, initCopyEmail, initYear].forEach((fn) => {
    try { fn(); } catch (err) { console.warn(`${fn.name} failed:`, err); }
  });
});
