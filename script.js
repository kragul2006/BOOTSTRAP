'use strict';

/* ─── DOM READY ─── */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initBackToTop();
  initScrollReveal();
  initCategoryFilter();
  initFormValidation();
  initSearchHandler();
  initNewsletterHandlers();
  initFilterWidget();
  initCarouselPause();
  initPriceRange();
  initCollapseChevrons();
  initTooltips();
  console.log('%c✦ Gather — Loaded', 'color:#c4553a;font-size:14px;font-weight:bold;');
});


/* ─── NAVBAR ─── */
function initNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  const onScroll = throttle(() => {
    nav.classList.toggle('scrolled', window.scrollY > 60);

    // Scrollspy: highlight active nav link
    const sections = document.querySelectorAll('section[id]');
    const links = nav.querySelectorAll('.nav-link[href^="#"]');
    const pos = window.scrollY + 100;
    let current = '';
    sections.forEach(s => { if (s.offsetTop <= pos) current = s.id; });
    links.forEach(l => {
      l.classList.remove('active');
      if (l.getAttribute('href') === `#${current}`) l.classList.add('active');
    });
  }, 100);

  window.addEventListener('scroll', onScroll, { passive: true });
}


/* ─── BACK TO TOP ─── */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', throttle(() => {
    btn.classList.toggle('visible', window.scrollY > 450);
  }, 150), { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}


/* ─── SCROLL REVEAL (IntersectionObserver) ─── */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal-card');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  els.forEach(el => obs.observe(el));
}


/* ─── CATEGORY FILTER ─── */
function initCategoryFilter() {
  const pills = document.querySelectorAll('.cat-pill');
  const cards = document.querySelectorAll('.events-grid [data-cat]');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const cat = pill.dataset.cat;

      cards.forEach(card => {
        const match = cat === 'all' || card.dataset.cat === cat;
        card.style.display = match ? '' : 'none';
        // Re-trigger reveal on visible cards
        if (match) {
          const article = card.querySelector('.reveal-card');
          if (article && !article.classList.contains('in-view')) {
            setTimeout(() => article.classList.add('in-view'), 50);
          }
        }
      });
    });
  });
}


/* ─── FORM VALIDATION ─── */
function initFormValidation() {
  const form = document.getElementById('registrationForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');

  // Real-time field feedback
  ['fullName', 'emailAddress'].forEach(id => {
    const field = document.getElementById(id);
    if (!field) return;
    field.addEventListener('input', () => {
      const valid = field.validity.valid && field.value.length > 0;
      field.classList.toggle('is-valid', valid);
      field.classList.toggle('is-invalid', !field.validity.valid && field.value.length > 0);
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    e.stopPropagation();
    form.classList.add('was-validated');

    if (form.checkValidity()) {
      submitBtn.disabled = true;
      const orig = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing…';

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = orig;

        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();

        form.reset();
        form.classList.remove('was-validated');
        showToast('Registered!', 'Your spot has been confirmed. Check your email.', 'success');
      }, 1800);

    } else {
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
      showToast('Incomplete form', 'Please fill in all required fields.', 'error');
    }
  });

  // Pre-fill category from card register button
  document.querySelectorAll('.btn-ecard').forEach(btn => {
    btn.addEventListener('click', () => {
      const badge = btn.closest('article')?.querySelector('.ecard-cat-badge');
      if (!badge) return;
      const text = badge.textContent.trim().toLowerCase();
      const map = { music: 'music', tech: 'tech', food: 'food', arts: 'art', wellness: 'wellness', lit: 'literature' };
      const sel = document.getElementById('eventCategory');
      if (!sel) return;
      for (const [k, v] of Object.entries(map)) {
        if (text.includes(k)) { sel.value = v; break; }
      }
    });
  });
}


/* ─── SEARCH ─── */
function initSearchHandler() {
  document.querySelectorAll('form[role="search"]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.querySelector('input[type="search"]');
      const q = input?.value.trim() ?? '';
      if (q.length < 2) { showToast('Search', 'Please type at least 2 characters.', 'warn'); return; }
      showToast('Searching…', `Finding events matching "${q}"`, 'info');
      setTimeout(() => {
        document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
        if (input) input.value = '';
      }, 800);
    });
  });
}


/* ─── NEWSLETTER ─── */
function initNewsletterHandlers() {
  document.querySelectorAll('.btn-nl-sub, .btn-footer-sub').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.input-group');
      if (!group) return;
      const input = group.querySelector('input[type="email"]');
      const email = input?.value.trim() ?? '';
      if (!email || !isValidEmail(email)) {
        showToast('Invalid email', 'Please enter a valid email address.', 'warn');
        input?.focus();
        return;
      }
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = orig;
        if (input) input.value = '';
        showToast('Subscribed! 🎉', `${email} added to our mailing list.`, 'success');
      }, 1200);
    });
  });
}


/* ─── SIDEBAR FILTER WIDGET ─── */
function initFilterWidget() {
  const btn = document.querySelector('.btn-filter-apply');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const cat = document.querySelector('.wselect')?.value ?? 'All';
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Filtering…';
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = 'Apply Filters';
      showToast('Filters applied', `Showing results for: ${cat}`, 'success');
    }, 900);
  });
}


/* ─── PRICE RANGE ─── */
function initPriceRange() {
  const range = document.getElementById('priceRange');
  const val = document.getElementById('priceVal');
  if (!range || !val) return;
  range.addEventListener('input', () => { val.textContent = `$${range.value}`; });
}


/* ─── CAROUSEL ─── */
function initCarouselPause() {
  const el = document.getElementById('galleryCarousel');
  if (!el) return;

  const carousel = bootstrap.Carousel.getOrCreateInstance(el, { interval: 4500, ride: 'carousel' });
  el.addEventListener('mouseenter', () => carousel.pause());
  el.addEventListener('mouseleave', () => carousel.cycle());

  document.addEventListener('keydown', e => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      if (e.key === 'ArrowLeft')  carousel.prev();
      if (e.key === 'ArrowRight') carousel.next();
    }
  });
}


/* ─── COLLAPSE CHEVRONS ─── */
function initCollapseChevrons() {
  document.querySelectorAll('[data-bs-toggle="collapse"] i.bi-chevron-down').forEach(icon => {
    icon.style.transition = 'transform 0.3s ease';
  });
  document.addEventListener('show.bs.collapse', e => {
    const icon = document.querySelector(`[data-bs-target="#${e.target.id}"] i.bi-chevron-down`);
    if (icon) icon.style.transform = 'rotate(180deg)';
  });
  document.addEventListener('hide.bs.collapse', e => {
    const icon = document.querySelector(`[data-bs-target="#${e.target.id}"] i.bi-chevron-down`);
    if (icon) icon.style.transform = 'rotate(0deg)';
  });
}


/* ─── TOOLTIPS ─── */
function initTooltips() {
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
}


/* ─── TOAST ─── */
function showToast(title, message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      zIndex: '11000', display: 'flex', flexDirection: 'column', gap: '0.6rem'
    });
    document.body.appendChild(container);
  }

  const iconMap = {
    success: 'bi-check-circle-fill',
    error:   'bi-x-circle-fill',
    warn:    'bi-exclamation-triangle-fill',
    info:    'bi-info-circle-fill',
  };
  const colorMap = {
    success: '#2d5a3d',
    error:   '#c4553a',
    warn:    '#d4a853',
    info:    '#1a5276',
  };

  const toast = document.createElement('div');
  toast.className = 'g-toast';
  toast.innerHTML = `
    <i class="bi ${iconMap[type] ?? iconMap.info} g-toast-icon" style="color:${colorMap[type] ?? colorMap.info}"></i>
    <div>
      <div class="g-toast-title">${escapeHTML(title)}</div>
      <div class="g-toast-msg">${escapeHTML(message)}</div>
    </div>
    <button class="g-toast-close" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);
  toast.querySelector('.g-toast-close').addEventListener('click', () => toast.remove());

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}


/* ─── UTILITIES ─── */
function throttle(fn, delay) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= delay) { last = now; return fn(...args); }
  };
}
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function escapeHTML(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}


/* ─── PAGE LOAD LOG ─── */
window.addEventListener('load', () => {
  if (window.performance) {
    const t = (performance.now() / 1000).toFixed(2);
    console.log(`%c⚡ Ready in ${t}s`, 'color:#2d5a3d;font-size:12px;');
  }
});
