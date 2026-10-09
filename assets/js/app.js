/* Scholars Planet — site scripts (no dependencies) */
(function () {
  'use strict';

  var STORE_KEY = 'sp_saved_v1';
  var CATEGORY_ORDER = ['Scholarship', 'Grant', 'Fellowship', 'Competition', 'Skills', 'Internship'];
  var CATEGORY_LABEL = {
    Scholarship: 'SCHOLARSHIPS', Grant: 'GRANTS', Fellowship: 'FELLOWSHIPS',
    Competition: 'COMPETITIONS', Skills: 'SKILLS & TRAINING', Internship: 'INTERNSHIPS'
  };
  var LEVEL_ORDER = ['Undergraduate', 'Postgraduate', 'High School'];

  /* ---------- date helpers (Africa/Lagos) ---------- */
  function todayYMD() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function toUTC(ymd) { return Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)); }
  function daysUntil(ymd) { return Math.round((toUTC(ymd) - toUTC(todayYMD())) / 86400000); }
  function isExpired(ymd) { return !!ymd && daysUntil(ymd) < 0; }
  function longDate(ymd) {
    try { return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(toUTC(ymd))); }
    catch (e) { return ymd; }
  }
  function countdownText(ymd) {
    var d = daysUntil(ymd);
    if (d < 0) return 'Closed';
    if (d === 0) return 'Closes today';
    return d + ' day' + (d === 1 ? '' : 's') + ' left';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- mobile menu ---------- */
  var menuBtn = qs('.menu-btn'), menu = qs('#mobile-menu');
  function setMenu(open) {
    if (!menuBtn || !menu) return;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
    var use = qs('use', menuBtn);
    if (use) use.setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) setMenu(false); });
  }

  /* ---------- saved posts (localStorage, per device) ---------- */
  function getSaved() {
    try { var v = JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function setSaved(list) { try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) {} }
  function refreshSavedUI() {
    var saved = getSaved();
    qsa('[data-save]').forEach(function (btn) {
      var on = saved.indexOf(btn.getAttribute('data-save')) !== -1;
      btn.classList.toggle('is-saved', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      var label = qs('.js-save-label', btn);
      if (label) label.textContent = on ? 'Saved' : 'Save for later';
    });
    qsa('.js-saved-count').forEach(function (el) {
      el.textContent = saved.length;
      el.hidden = saved.length === 0;
    });
  }
  function toggleSaved(slug) {
    var saved = getSaved(), i = saved.indexOf(slug);
    if (i === -1) saved.push(slug); else saved.splice(i, 1);
    setSaved(saved);
    refreshSavedUI();
    if (qs('#saved-root')) renderSaved();
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-save]');
    if (!btn) return;
    e.preventDefault();
    toggleSaved(btn.getAttribute('data-save'));
  });

  /* ---------- copy to clipboard ---------- */
  function copyText(text, done) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      if (done) done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { if (done) done(); }, fallback);
    } else { fallback(); }
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var original = btn.innerHTML;
    copyText(btn.getAttribute('data-copy'), function () {
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.innerHTML = original; }, 1600);
    });
  });

  /* ---------- expiry, countdowns, sorting ---------- */
  function shortDate(ymd) {
    try { return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(toUTC(ymd))); }
    catch (e) { return ymd; }
  }
  function markExpired(card) {
    if (card.getAttribute('data-expired') === '1' && card.classList.contains('is-expired')) return;
    card.setAttribute('data-expired', '1');
    card.classList.add('is-expired');
    var tags = qs('.card-tags', card);
    if (tags && !qs('.chip-expired', tags)) {
      var chip = document.createElement('span');
      chip.className = 'chip chip-expired'; chip.textContent = 'Expired';
      tags.insertBefore(chip, tags.firstChild);
    }
    var cd = qs('.js-countdown', card);
    if (cd) {
      cd.classList.remove('is-urgent'); cd.classList.add('is-expired-text');
      var t = qs('.js-countdown-text', cd);
      if (t) t.textContent = 'Closed ' + shortDate(card.getAttribute('data-deadline'));
    }
  }
  function applyExpiry() {
    qsa('.card[data-deadline]').forEach(function (card) {
      var dl = card.getAttribute('data-deadline');
      if (dl && isExpired(dl)) { markExpired(card); return; }
      var el = qs('.js-countdown', card), t = el && qs('.js-countdown-text', el);
      if (dl && el && t) {
        t.textContent = countdownText(dl);
        el.classList.toggle('is-urgent', daysUntil(dl) <= 7);
      }
    });
    var open = qs('.js-open-banner'), closed = qs('.js-closed-banner');
    if (open && closed) {
      var dl2 = open.getAttribute('data-deadline');
      if (dl2 && isExpired(dl2)) { open.hidden = true; closed.hidden = false; }
      else if (dl2) {
        var tt = qs('.js-countdown-text', open), d = daysUntil(dl2);
        if (tt) tt.textContent = d === 0 ? 'Closes today' : d + ' day' + (d === 1 ? '' : 's') + ' left to apply';
      }
    }
  }
  // open ones first (nearest deadline, then no-deadline), expired ones last (most recent first)
  function sortGrid(grid) {
    if (!grid) return;
    var cards = qsa('.card[data-deadline]', grid);
    function rank(c) {
      var dl = c.getAttribute('data-deadline');
      if (dl && isExpired(dl)) return 2;
      return dl ? 0 : 1;
    }
    cards.sort(function (a, b) {
      var ra = rank(a), rb = rank(b);
      if (ra !== rb) return ra - rb;
      var da = a.getAttribute('data-deadline') || '', db = b.getAttribute('data-deadline') || '';
      if (ra === 0) return da < db ? -1 : da > db ? 1 : 0;
      if (ra === 2) return da < db ? 1 : da > db ? -1 : 0;
      return 0;
    });
    cards.forEach(function (c) { grid.appendChild(c); });
  }

  /* ---------- listing filters ---------- */
  var listing = qs('#listing');
  if (listing) {
    var grid = qs('#grid'), empty = qs('#empty'), countEl = qs('#result-count'), qInput = qs('#q');
    var state = { category: 'all', level: 'all', status: 'all', q: '' };
    var params = new URLSearchParams(window.location.search);
    if (params.get('category')) state.category = params.get('category').toLowerCase();
    if (params.get('level')) state.level = params.get('level').toLowerCase().replace(/\s+/g, '-');
    if (params.get('status')) state.status = params.get('status').toLowerCase();
    if (params.get('q')) state.q = params.get('q');
    if (qInput) qInput.value = state.q;

    var syncPills = function () {
      qsa('.pills').forEach(function (group) {
        var key = group.getAttribute('data-filter'), found = false;
        qsa('.pill', group).forEach(function (p) {
          var on = p.getAttribute('data-value') === state[key];
          if (on) found = true;
          p.classList.toggle('is-active', on);
        });
        if (!found) { state[key] = 'all'; qs('.pill[data-value="all"]', group).classList.add('is-active'); }
      });
    };
    var apply = function () {
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean), openShown = 0, closedShown = 0;
      qsa('.card', grid).forEach(function (card) {
        var expired = card.getAttribute('data-expired') === '1';
        var okCat = state.category === 'all' || card.getAttribute('data-category') === state.category;
        var okLvl = state.level === 'all' || (' ' + card.getAttribute('data-level') + ' ').indexOf(' ' + state.level + ' ') !== -1;
        var okStatus = state.status === 'all' || (state.status === 'open' && !expired) || (state.status === 'expired' && expired);
        var hay = (card.getAttribute('data-title') + ' ' + (qs('.card-text', card) || { textContent: '' }).textContent + ' ' + card.getAttribute('data-category')).toLowerCase();
        var okQ = words.every(function (w) { return hay.indexOf(w) !== -1; });
        var show = okCat && okLvl && okStatus && okQ;
        card.hidden = !show;
        if (show) { if (expired) closedShown++; else openShown++; }
      });
      var total = openShown + closedShown;
      if (countEl) {
        countEl.textContent = closedShown
          ? openShown + ' open · ' + closedShown + ' expired'
          : openShown + (openShown === 1 ? ' opportunity' : ' opportunities') + ' open now';
      }
      if (empty) empty.hidden = total !== 0;
      try {
        var p = new URLSearchParams();
        if (state.category !== 'all') p.set('category', state.category);
        if (state.level !== 'all') p.set('level', state.level);
        if (state.status !== 'all') p.set('status', state.status);
        if (state.q) p.set('q', state.q);
        var qsStr = p.toString();
        history.replaceState(null, '', window.location.pathname + (qsStr ? '?' + qsStr : ''));
      } catch (e) {}
    };
    listing.addEventListener('click', function (e) {
      var pill = e.target.closest('.pill');
      if (!pill) return;
      var key = pill.parentNode.getAttribute('data-filter');
      state[key] = pill.getAttribute('data-value');
      syncPills(); apply();
    });
    if (qInput) qInput.addEventListener('input', function () { state.q = qInput.value.trim(); apply(); });
    applyExpiry();
    sortGrid(grid);
    syncPills();
    apply();
  } else {
    applyExpiry();
    sortGrid(qs('#home-grid'));
  }

  /* ---------- saved page ---------- */
  var savedData = null;
  function cardHTML(item) {
    var closed = isExpired(item.deadline);
    var dl = item.deadline
      ? '<span class="deadline js-countdown ' + (closed ? 'is-expired-text' : (daysUntil(item.deadline) <= 7 ? 'is-urgent' : '')) + '" data-deadline="' + esc(item.deadline) + '"><svg class="ic"><use href="#i-clock"/></svg> <span class="js-countdown-text">' + esc(closed ? 'Closed ' + shortDate(item.deadline) : countdownText(item.deadline)) + '</span></span>'
      : '<span class="deadline"><svg class="ic"><use href="#i-clock"/></svg> No fixed deadline</span>';
    var chips = (closed ? '<span class="chip chip-expired">Expired</span>' : '') + '<span class="chip chip-cat">' + esc(item.category) + '</span>' + item.levels.map(function (l) { return '<span class="chip chip-level">' + esc(l) + '</span>'; }).join('');
    return '<article class="card' + (closed ? ' is-expired' : '') + '" data-deadline="' + esc(item.deadline || '') + '" data-expired="' + (closed ? '1' : '0') + '">' +
      '<button class="save-btn is-saved" type="button" data-save="' + esc(item.slug) + '" aria-label="Remove ' + esc(item.title) + ' from saved" aria-pressed="true"><svg class="ic"><use href="#i-bookmark"/></svg></button>' +
      '<div class="card-tags">' + chips + '</div>' +
      '<h3 class="card-title"><a href="' + esc(item.url) + '">' + esc(item.title) + '</a></h3>' +
      '<p class="card-text">' + esc(item.summary) + '</p>' +
      '<div class="card-foot">' + dl + '<span class="card-link">View details <svg class="ic"><use href="#i-arrow"/></svg></span></div></article>';
  }
  function renderSaved() {
    var root = qs('#saved-root'); if (!root || !savedData) return;
    var saved = getSaved();
    var items = savedData.filter(function (i) { return saved.indexOf(i.slug) !== -1; });
    items.sort(function (a, b) {
      var ea = isExpired(a.deadline), eb = isExpired(b.deadline);
      if (ea !== eb) return ea ? 1 : -1;
      if (a.deadline && b.deadline) return a.deadline < b.deadline ? -1 : 1;
      if (a.deadline) return -1; if (b.deadline) return 1; return 0;
    });
    root.innerHTML = items.map(cardHTML).join('');
    qs('#saved-empty').hidden = items.length !== 0;
    qs('#saved-note').hidden = items.length === 0;
    refreshSavedUI();
  }
  if (qs('#saved-root')) {
    fetch('/data/opportunities.json').then(function (r) { return r.json(); }).then(function (data) {
      savedData = data; renderSaved();
    }).catch(function () {
      var e = qs('#saved-empty'); e.hidden = false; e.textContent = 'Could not load your saved opportunities right now. Please try again.';
    });
  }

  /* ---------- WhatsApp list (admin) ---------- */
  var waData = qs('#wa-data');
  if (waData) {
    var items = JSON.parse(waData.textContent), site = JSON.parse(qs('#wa-site').textContent);
    var groupsEl = qs('#wa-groups'), catSel = qs('#wa-cat'), statusEl = qs('#wa-status');
    var active = items.filter(function (i) { return !isExpired(i.deadline); });
    var cats = CATEGORY_ORDER.filter(function (c) { return active.some(function (i) { return i.category === c; }); });
    active.forEach(function (i) { if (cats.indexOf(i.category) === -1 && i.category) cats.push(i.category); });
    cats.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o); });

    var levelKey = function (levels) {
      if (!levels.length) return 'All levels';
      return levels.slice().sort(function (a, b) { return LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b); }).join(' & ');
    };
    var buildGroups = function (only) {
      var out = [];
      cats.forEach(function (cat) {
        if (only !== 'all' && only !== cat) return;
        var inCat = active.filter(function (i) { return i.category === cat; });
        var byLevel = {}, order = [];
        inCat.forEach(function (i) { var k = levelKey(i.levels); if (!byLevel[k]) { byLevel[k] = []; order.push(k); } byLevel[k].push(i); });
        order.sort(function (a, b) { return LEVEL_ORDER.indexOf(a.split(' & ')[0]) - LEVEL_ORDER.indexOf(b.split(' & ')[0]); });
        order.forEach(function (k) {
          var heading = (CATEGORY_LABEL[cat] || cat.toUpperCase()) + ' (' + k.toUpperCase() + ')';
          var lines = byLevel[k].map(function (i, n) {
            return (n + 1) + '. ' + i.title + '\nLink: ' + site.url + i.url + '\nDeadline: ' + (i.deadline ? longDate(i.deadline) : 'Check the official page');
          });
          out.push({ title: CATEGORY_LABEL[cat] ? cat + ' · ' + k : cat + ' · ' + k, text: heading + '\n\n' + lines.join('\n\n') });
        });
      });
      return out;
    };
    var fullMessage = function (groups) {
      return 'ONGOING OPPORTUNITIES ON SCHOLARS PLANET\nUpdated: ' + longDate(todayYMD()) + '\n\n' +
        groups.map(function (g) { return g.text; }).join('\n\n\n') +
        '\n\n\nJoin our WhatsApp channel for new opportunities first:\n' + site.whatsapp;
    };
    var flash = function (msg) { statusEl.textContent = msg; setTimeout(function () { statusEl.textContent = ''; }, 2400); };
    var render = function () {
      var groups = buildGroups(catSel.value);
      groupsEl.innerHTML = '';
      if (!groups.length) { groupsEl.innerHTML = '<div class="empty">There are no open opportunities to list right now.</div>'; return; }
      groups.forEach(function (g, idx) {
        var box = document.createElement('div'); box.className = 'wa-group';
        box.innerHTML = '<div class="wa-group-head"><h3>' + esc(g.title) + '</h3><button class="btn btn-ghost btn-sm" type="button" data-idx="' + idx + '"><svg class="ic"><use href="#i-copy"/></svg> Copy this group</button></div><pre>' + esc(g.text) + '</pre>';
        groupsEl.appendChild(box);
      });
      groupsEl._groups = groups;
    };
    groupsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-idx]'); if (!b) return;
      copyText(groupsEl._groups[+b.getAttribute('data-idx')].text, function () { flash('Group copied'); });
    });
    qs('#wa-copy-all').addEventListener('click', function () {
      var g = buildGroups(catSel.value); if (!g.length) return;
      copyText(fullMessage(g), function () { flash('Copied. Paste it into WhatsApp.'); });
    });
    catSel.addEventListener('change', render);
    render();
  }

  refreshSavedUI();
})();
