/* The Viral Bee — site behaviour (vanilla JS, no build step).
   Content for case studies, design projects and images lives in site-data.js. */
(function () {
  'use strict';

  var DATA = window.SITE;
  if (!DATA) { console.error('site-data.js failed to load'); return; }
  var IMG = DATA.images;

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function img(key, eager) {
    var m = IMG[key];
    if (!m) return '';
    return '<img src="' + esc(m.src) + '" width="' + m.w + '" height="' + m.h + '" alt="' + esc(m.alt) +
      '" decoding="async"' + (eager ? '' : ' loading="lazy"') + '>';
  }
  function metric(c, label) {
    return c.metrics.filter(function (m) { return m.label === label; })[0];
  }

  /* Industry tag + the supporting figure shown on each card (the lead figure is always Views). */
  var CARD_META = {
    samsung:   { tag: 'Tech',        second: 'Student KOLs' },
    vinasoy:   { tag: 'FMCG',        second: 'Engagements' },
    vespa:     { tag: 'Mobility',    second: 'PR articles' },
    kate:      { tag: 'Beauty',      second: 'KOLs/KOCs' },
    highlands: { tag: 'F&B',         second: 'Engagements' },
    masterise: { tag: 'Real estate', second: 'Engagements' }
  };
  var LABEL_FMT = { 'Student KOLs': 'student KOLs', 'KOLs/KOCs': 'KOLs/KOCs', 'PR articles': 'PR articles', 'Engagements': 'engagements' };
  var TAG_ORDER =['Tech', 'FMCG', 'Beauty', 'F&B', 'Mobility', 'Real estate'];

  /* ---------- work: cards + filters ---------- */
  var casesEl = $('#cases');
  var filtersEl = $('#filters');

  function caseCard(c) {
    var meta = CARD_META[c.id] || { tag: '', second: '' };
    var views = metric(c, 'Views');
    var second = metric(c, meta.second);
    var lead = views ? views.value : c.metrics[0].value;
    var sub = (views ? 'views' : c.metrics[0].label.toLowerCase()) +
      (second ? ' · ' + second.value + ' ' + (LABEL_FMT[second.label] || second.label.toLowerCase()) : '');
    return '<article class="case" data-id="' + esc(c.id) + '" data-tag="' + esc(meta.tag) + '">' +
      '<div class="img">' + img(c.cover) + '<span class="tag">' + esc(meta.tag) + '</span></div>' +
      '<div class="body"><h3>' + esc(c.client) + '</h3><p class="proj">' + esc(c.project) + '</p>' +
      '<div class="res"><b>' + esc(lead) + '</b><span>' + esc(sub) + '</span>' +
      '<button class="case-open" type="button" aria-haspopup="dialog" data-case="' + esc(c.id) + '">' +
      '<span class="vh">View case study: ' + esc(c.client) + '</span><span aria-hidden="true">→</span></button></div>' +
      '</div></article>';
  }

  if (casesEl) {
    casesEl.innerHTML = DATA.cases.map(caseCard).join('');

    var tags = TAG_ORDER.filter(function (t) {
      return DATA.cases.some(function (c) { return (CARD_META[c.id] || {}).tag === t; });
    });
    filtersEl.innerHTML = ['All'].concat(tags).map(function (t, i) {
      return '<button class="chip" type="button" aria-pressed="' + (i === 0) + '" data-f="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');

    filtersEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', filtersEl).forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      var f = chip.getAttribute('data-f');
      $$('.case', casesEl).forEach(function (card) {
        card.hidden = !(f === 'All' || card.getAttribute('data-tag') === f);
      });
    });
  }

  /* ---------- design: tiles ---------- */
  var tilesEl = $('#tiles');
  var DESIGN_SHORT = {
    ghiv: 'A boutique photo studio that runs on constant motion. The horse became the mark: bold, fearless, always galloping forward.',
    bond: 'A Saigon burger spot built for bonding with the homies. Sticky type and a flame accent.',
    kientrung: 'An embossed Tết gift box inspired by the mosaic art of Kiến Trung Palace in Huế.'
  };
  var DESIGN_NAME = { kientrung: 'Kiến Trung' };
  var TILE_COVER = { ghiv: 0, bond: 0, kientrung: 1 }; /* which image of each project is the tile cover */

  if (tilesEl) {
    tilesEl.innerHTML = DATA.design.map(function (d) {
      return '<button class="tile" type="button" aria-haspopup="dialog" data-design="' + esc(d.id) + '">' +
        '<div class="img">' + img(d.images[TILE_COVER[d.id] || 0]) + '</div>' +
        '<div class="meta"><h3>' + esc(DESIGN_NAME[d.id] || d.name) + '</h3><span class="disc">' + esc(d.discipline) + '</span></div>' +
        '<p>' + esc(DESIGN_SHORT[d.id] || d.caption) + '</p></button>';
    }).join('');
  }

  /* ---------- dialog (case study + design gallery) ---------- */
  var dlg = $('#modal');
  var lastTrigger = null;

  function modalShell(eyebrow, inner) {
    return '<div class="modal-bar"><span class="eyebrow">' + esc(eyebrow) + '</span>' +
      '<button class="modal-close" type="button" aria-label="Close" data-close><span aria-hidden="true">×</span></button></div>' +
      '<div class="modal-scroll">' + inner + '</div>';
  }

  function renderCase(c) {
    return modalShell('Case study',
      '<header><p class="modal-client">' + esc(c.client) + '</p><h2 class="modal-title" id="modal-title">' + esc(c.project) + '</h2>' +
      '<p class="modal-summary">' + esc(c.summary) + '</p></header>' +
      '<figure>' + img(c.cover, true) + '</figure>' +
      '<dl class="modal-metrics">' + c.metrics.map(function (m) {
        return '<div><dd>' + esc(m.value) + '</dd><dt>' + esc(m.label) + '</dt></div>';
      }).join('') + '</dl>' +
      '<div class="modal-cols"><div><h3>The brief</h3><p>' + esc(c.context) + '</p><h3>What we did</h3><p>' + esc(c.approach) + '</p></div>' +
      '<div><h3>Our role</h3><ul class="role-list">' + c.role.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul></div></div>' +
      c.gallery.map(function (g) { return '<figure>' + img(g, true) + '</figure>'; }).join('') +
      '<div class="modal-foot"><a class="btn btn-primary" href="#contact" data-goto-contact>Start a project <span aria-hidden="true">→</span></a>' +
      '<button class="btn btn-ghost" type="button" data-close>Back to work</button></div>');
  }

  function renderDesign(d) {
    return modalShell('Creative showcase',
      '<header><p class="modal-client">' + esc(d.discipline) + '</p><h2 class="modal-title" id="modal-title">' + esc(d.name) + '</h2>' +
      '<p class="modal-summary">' + esc(d.caption) + '</p></header>' +
      d.images.map(function (k) { return '<figure>' + img(k, true) + '</figure>'; }).join('') +
      '<div class="modal-foot"><a class="btn btn-primary" href="#contact" data-goto-contact>Start a project <span aria-hidden="true">→</span></a>' +
      '<button class="btn btn-ghost" type="button" data-close>Back to design</button></div>');
  }

  function openModal(html, trigger) {
    lastTrigger = trigger || null;
    dlg.innerHTML = html;
    dlg.querySelector('.modal-scroll').scrollTop = 0;
    document.body.style.overflow = 'hidden';
    dlg.showModal();
    var close = dlg.querySelector('.modal-close');
    if (close) close.focus();
  }

  if (dlg && typeof dlg.showModal === 'function') {
    document.addEventListener('click', function (e) {
      var c = e.target.closest('[data-case]');
      if (c) {
        var data = DATA.cases.filter(function (x) { return x.id === c.getAttribute('data-case'); })[0];
        if (data) openModal(renderCase(data), c);
        return;
      }
      var t = e.target.closest('[data-design]');
      if (t) {
        var d = DATA.design.filter(function (x) { return x.id === t.getAttribute('data-design'); })[0];
        if (d) openModal(renderDesign(d), t);
      }
    });

    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-close]')) { dlg.close(); return; }
      if (e.target.closest('[data-goto-contact]')) {
        e.preventDefault();
        lastTrigger = null;
        dlg.close();
        setTimeout(function () {
          var contact = $('#contact');
          if (contact) contact.scrollIntoView({ behavior: 'smooth' });
          var name = $('#f-name');
          if (name) name.focus({ preventScroll: true });
        }, 30);
      }
    });

    dlg.addEventListener('close', function () {
      document.body.style.overflow = '';
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
      lastTrigger = null;
    });
  }

  /* ---------- header: services placeholders, mobile menu, active link ---------- */
  $$('[data-soon]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  var header = $('#site-header');
  var menuBtn = $('#menu-btn');
  function setMenu(open) {
    header.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () { setMenu(!header.classList.contains('menu-open')); });
  $('#nav').addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (a && !a.hasAttribute('data-soon')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); }
  });

  var navLinks = $$('.nav a[href^="#"]').filter(function (a) { return a.getAttribute('href').length > 1; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { io.observe(s); });
  }

  /* ---------- hero proof numbers: count up once when they scroll into view ---------- */
  var proof = $('.proof');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (proof && !reduceMotion) {
    var counters = $$('dd', proof).map(function (dd) {
      var final = dd.textContent.trim();
      var m = /^([\d,]+)(.*)$/.exec(final);
      if (!m) return null;
      /* screen readers get the final value once; the visible number is decorative */
      dd.innerHTML = '<span class="vh">' + esc(final) + '</span>' +
        '<span class="count-sizer" aria-hidden="true">' + esc(final) + '</span>' +
        '<span class="count-live" aria-hidden="true"></span>';
      return {
        live: dd.querySelector('.count-live'),
        to: parseInt(m[1].replace(/,/g, ''), 10),
        suffix: m[2],
        comma: m[1].indexOf(',') > -1
      };
    }).filter(Boolean);

    var fmt = function (c, n) { return (c.comma ? n.toLocaleString('en-US') : String(n)) + c.suffix; };
    counters.forEach(function (c) { c.live.textContent = fmt(c, 0); });

    var runCount = function () {
      var DURATION = 1800, STAGGER = 140;
      var t0 = performance.now();
      (function tick(now) {
        var done = true;
        counters.forEach(function (c, i) {
          var p = Math.min(1, Math.max(0, (now - t0 - i * STAGGER) / DURATION));
          var eased = 1 - Math.pow(1 - p, 3);            /* ease-out: fast start, gentle landing */
          c.live.textContent = fmt(c, Math.round(c.to * eased));
          if (p < 1) done = false;
        });
        if (!done) requestAnimationFrame(tick);
      })(t0);
    };

    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { cio.disconnect(); setTimeout(runCount, 250); }
      }, { threshold: 0.6 });
      cio.observe(proof);
    } else {
      counters.forEach(function (c) { c.live.textContent = fmt(c, c.to); });
    }
  }

  /* ---------- footer ---------- */
  var cred = $('#cred-link');
  if (cred && DATA.credentialsUrl) cred.href = DATA.credentialsUrl;
  var yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- contact form (same rules and messages as the previous site) ---------- */
  var form = $('#brief-form');
  var status = $('#form-status');
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var FIELDS = ['name', 'email', 'company', 'service', 'brief'];

  function values() {
    var v = {};
    FIELDS.forEach(function (n) {
      if (n === 'service') {
        var r = form.querySelector('input[name="service"]:checked');
        v[n] = r ? r.value : '';
      } else {
        v[n] = form.elements[n].value;
      }
    });
    return v;
  }

  function validate(v) {
    var e = {};
    if (!v.name.trim()) e.name = 'Please enter your full name.';
    if (!v.email.trim()) e.email = 'Please enter your work email.';
    else if (!EMAIL.test(v.email.trim())) e.email = 'That email doesn’t look right. Try name@company.com.';
    if (!v.company.trim()) e.company = 'Please enter your company or brand.';
    if (!v.service) e.service = 'Please choose a service.';
    if (v.brief.trim().length < 20) e.brief = 'Tell us a little more — at least 20 characters.';
    return e;
  }

  function showError(name, msg) {
    var p = $('#e-' + name);
    var ctl = name === 'service' ? $('#f-service') : form.elements[name];
    if (!p) return;
    p.hidden = !msg;
    p.textContent = msg || '';
    if (name !== 'service') {
      if (msg) { ctl.setAttribute('aria-invalid', 'true'); ctl.setAttribute('aria-describedby', 'e-' + name); }
      else { ctl.removeAttribute('aria-invalid'); ctl.removeAttribute('aria-describedby'); }
    }
  }

  var touched = {};
  function refresh() {
    var errs = validate(values());
    FIELDS.forEach(function (n) { showError(n, touched[n] ? errs[n] : ''); });
    return errs;
  }

  if (form) {
    form.addEventListener('input', function (e) {
      var n = e.target.name;
      if (touched[n]) refresh();
      status.innerHTML = '';
    });
    form.addEventListener('focusout', function (e) {
      var n = e.target.name;
      if (n && FIELDS.indexOf(n) > -1) { touched[n] = true; refresh(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      FIELDS.forEach(function (n) { touched[n] = true; });
      var errs = refresh();
      var first = FIELDS.filter(function (n) { return errs[n]; })[0];
      if (first) {
        var target = first === 'service' ? form.querySelector('input[name="service"]') : form.elements[first];
        if (target) target.focus();
        return;
      }
      /* Not connected to a backend yet — say so plainly rather than pretending to send. */
      status.innerHTML = '<p class="status-note">Your brief looks complete, but this demo form isn’t connected yet — <strong>nothing has been sent</strong>. Please share it with your The Viral Bee contact directly for now.</p>';
    });
  }
})();
