(function () {
  'use strict';

  var SUPA_URL = 'https://jspdwpeepjroleorelbw.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcGR3cGVlcGpyb2xlb3JlbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTMzODQsImV4cCI6MjA5MjYyOTM4NH0.D0NXPMI9IYSzdhz8qqjMLeCWgNAY4YQqyMwyHyzj6vQ';
  var DURATION = 30;
  var MAX_AUTO_ADVANCE = 8; // settimane saltate automaticamente se vuote
  var MAX_PER_DAY = 3;      // slot mostrati per giorno (scarsita', solo vista)

  var apiHeaders = {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': 'Bearer ' + ANON_KEY
  };

  var WD       = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  var WD_FULL  = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  var MON      = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  var MON_FULL = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  var state = {
    today: null,        // Date (oggi, mezzanotte locale)
    todayStr: '',       // YYYY-MM-DD
    weekStart: null,    // Date (lunedì della settimana visualizzata)
    byDay: {},          // { 'YYYY-MM-DD': [ {data_ora, ora}, ... ] }
    selectedDay: null,  // YYYY-MM-DD
    selectedSlot: null, // { data_ora, ora }
    loading: false,
    autoAdvance: 0
  };
  var weekCache = {};   // from_date -> slots[]

  /* ---------- date helpers (local time) ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function addD(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function mondayOf(d) {
    var wd = d.getDay();
    var diff = (wd === 0 ? -6 : 1 - wd);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  }
  function midnight(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  /* ---------- API ---------- */
  function fetchWeek(fromStr) {
    if (weekCache[fromStr]) return Promise.resolve(weekCache[fromStr]);
    return fetch(SUPA_URL + '/functions/v1/get-consultation-slots', {
      method: 'POST', headers: apiHeaders,
      body: JSON.stringify({ from_date: fromStr, days: 7, duration_minutes: DURATION })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var slots = d.slots || [];
      weekCache[fromStr] = slots;
      return slots;
    });
  }

  function bookSlot(nome, cognome, telefono, data_ora) {
    return fetch(SUPA_URL + '/functions/v1/book-consultation', {
      method: 'POST', headers: apiHeaders,
      body: JSON.stringify({ nome: nome, cognome: cognome, telefono: telefono, data_ora: data_ora })
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok) { var e = new Error(d.message || d.error || 'Errore'); e.code = d.error; throw e; }
        return d;
      });
    });
  }

  /* ---------- styles ---------- */
  function injectStyles() {
    if (document.getElementById('cform-styles')) return;
    var s = document.createElement('style');
    s.id = 'cform-styles';
    s.textContent = [
      '.cform-section{padding:clamp(4rem,9vw,8rem) 0;background:var(--cream,#F8F4EF)}',
      '.cform-inner{max-width:760px;margin:0 auto;padding:0 clamp(1.25rem,5vw,3rem)}',
      '.cform-header{text-align:center;margin-bottom:2.5rem}',
      '.cform-kicker{font-family:var(--f-body,"Outfit",sans-serif);font-size:.6875rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-deep,#8B6B2E);margin-bottom:.75rem}',
      '.cform-title{font-family:var(--f-display,"Cormorant",Georgia,serif);font-size:clamp(2rem,5vw,3.25rem);font-weight:300;line-height:1.05;color:var(--ink,#1A1814);margin-bottom:1rem}',
      '.cform-desc{font-family:var(--f-body,"Outfit",sans-serif);font-size:1rem;line-height:1.7;color:var(--ink-soft,#4A4540);max-width:520px;margin:0 auto}',
      /* calendar */
      '.cform-cal{margin-bottom:2.25rem}',
      '.cform-cal-nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.5rem}',
      '.cform-cal-range{font-family:var(--f-display,"Cormorant",Georgia,serif);font-size:1.375rem;font-weight:400;color:var(--ink,#1A1814);text-align:center;flex:1;text-transform:capitalize}',
      '.cform-arrow{flex:0 0 auto;width:2.75rem;height:2.75rem;border-radius:50%;border:1.5px solid var(--gold-pale,#E8D5B0);background:var(--surface,#FDFAF6);color:var(--ink,#1A1814);font-size:1.1rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 180ms}',
      '.cform-arrow:hover:not(:disabled){border-color:var(--gold,#B8965A);background:rgba(184,150,90,.06)}',
      '.cform-arrow:disabled{opacity:.3;cursor:not-allowed}',
      '.cform-days{display:grid;grid-template-columns:repeat(7,1fr);gap:.4rem;margin-bottom:1.75rem}',
      '.cform-day{display:flex;flex-direction:column;align-items:center;gap:.15rem;padding:.6rem .2rem;background:var(--surface,#FDFAF6);border:1.5px solid var(--gold-pale,#E8D5B0);color:var(--ink,#1A1814);cursor:pointer;transition:all 160ms;line-height:1.1}',
      '.cform-day:hover:not(:disabled){border-color:var(--gold,#B8965A)}',
      '.cform-day.cform-day-sel{background:var(--gold,#B8965A);border-color:var(--gold,#B8965A)}',
      '.cform-day:disabled{opacity:.32;cursor:not-allowed;background:transparent}',
      '.cform-day-wd{font-family:var(--f-body,"Outfit",sans-serif);font-size:.625rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted,#7A7570)}',
      '.cform-day.cform-day-sel .cform-day-wd{color:var(--ink,#1A1814)}',
      '.cform-day-num{font-family:var(--f-display,"Cormorant",Georgia,serif);font-size:1.375rem;font-weight:500}',
      '.cform-times-label{font-family:var(--f-body,"Outfit",sans-serif);font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted,#7A7570);margin-bottom:1.25rem;text-align:center}',
      '.cform-times{display:flex;flex-wrap:wrap;justify-content:center;gap:1rem}',
      '.cform-time{font-family:var(--f-body,"Outfit",sans-serif);font-size:.9375rem;font-weight:500;min-width:104px;padding:.8125rem 1.25rem;background:var(--surface,#FDFAF6);border:1.5px solid var(--gold-pale,#E8D5B0);color:var(--ink,#1A1814);cursor:pointer;text-align:center;transition:all 160ms}',
      '.cform-time:hover{border-color:var(--gold,#B8965A);background:rgba(184,150,90,.06)}',
      '.cform-time.cform-time-sel{background:var(--gold,#B8965A);border-color:var(--gold,#B8965A);font-weight:600}',
      '.cform-empty{font-family:var(--f-body,"Outfit",sans-serif);font-size:.9375rem;color:var(--ink-muted,#7A7570);padding:1.5rem 0;text-align:center}',
      '.cform-loading{display:flex;gap:.5rem;align-items:center;justify-content:center;font-family:var(--f-body,"Outfit",sans-serif);font-size:.875rem;color:var(--ink-muted,#7A7570);padding:2rem 0}',
      '.cform-spinner{width:1rem;height:1rem;border:2px solid var(--gold-pale,#E8D5B0);border-top-color:var(--gold,#B8965A);border-radius:50%;animation:cfspin .7s linear infinite}',
      '@keyframes cfspin{to{transform:rotate(360deg)}}',
      /* contact */
      '.cform-contact{display:none;border-top:1px solid var(--gold-pale,#E8D5B0);padding-top:2rem;margin-top:2.25rem}.cform-contact.cform-visible{display:block}',
      '.cform-contact-title{font-family:var(--f-display,"Cormorant",Georgia,serif);font-size:1.5rem;font-weight:300;color:var(--ink,#1A1814);margin-bottom:1.25rem}',
      '.cform-badge{display:inline-block;font-family:var(--f-body,"Outfit",sans-serif);font-size:.8125rem;font-weight:600;background:var(--gold,#B8965A);color:var(--ink,#1A1814);padding:.4rem .875rem;margin-bottom:1.5rem;text-transform:capitalize}',
      '.cform-fields{display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem}',
      '@media(min-width:560px){.cform-fields{flex-direction:row;flex-wrap:wrap}.cform-field{flex:1 1 180px}}',
      '.cform-field{display:flex;flex-direction:column;gap:.375rem}',
      '.cform-field label{font-family:var(--f-body,"Outfit",sans-serif);font-size:.75rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-muted,#7A7570)}',
      '.cform-field input{font-family:var(--f-body,"Outfit",sans-serif);font-size:.9375rem;padding:.8125rem 1rem;background:var(--surface,#FDFAF6);border:1.5px solid var(--gold-pale,#E8D5B0);color:var(--ink,#1A1814);outline:none;transition:border-color 180ms;width:100%;box-sizing:border-box}',
      '.cform-field input:focus{border-color:var(--gold,#B8965A)}',
      '.cform-submit{font-family:var(--f-body,"Outfit",sans-serif);font-size:.75rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:.9375rem 2.5rem;background:var(--gold,#B8965A);border:1px solid var(--gold,#B8965A);color:var(--ink,#1A1814);cursor:pointer;transition:all 380ms}',
      '.cform-submit:hover{background:var(--gold-deep,#8B6B2E);border-color:var(--gold-deep,#8B6B2E)}',
      '.cform-submit:disabled{opacity:.55;cursor:not-allowed}',
      '.cform-error{font-family:var(--f-body,"Outfit",sans-serif);font-size:.875rem;color:#dc2626;padding:.75rem 1rem;background:rgba(220,38,38,.06);border:1px solid rgba(220,38,38,.2);margin-bottom:1rem;display:none}',
      '.cform-error.cform-visible{display:block}',
      '.cform-success{text-align:center;padding:3rem 1rem;display:none}.cform-success.cform-visible{display:block}',
      '.cform-success-icon{width:3rem;height:3rem;border:2px solid var(--gold,#B8965A);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;font-size:1.25rem;color:var(--gold,#B8965A)}',
      '.cform-success-title{font-family:var(--f-display,"Cormorant",Georgia,serif);font-size:2rem;font-weight:300;color:var(--ink,#1A1814);margin-bottom:.75rem}',
      '.cform-success-body{font-family:var(--f-body,"Outfit",sans-serif);font-size:1rem;color:var(--ink-soft,#4A4540);line-height:1.7;max-width:440px;margin:0 auto}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- DOM helpers ---------- */
  function el(tag, cls, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  function makeField(id, label, type, placeholder, autocomplete) {
    var wrap = el('div', 'cform-field');
    var lbl = document.createElement('label'); lbl.htmlFor = id; lbl.textContent = label;
    var inp = document.createElement('input');
    inp.id = id; inp.type = type; inp.placeholder = placeholder;
    inp.autocomplete = autocomplete; inp.required = true;
    wrap.appendChild(lbl); wrap.appendChild(inp);
    return wrap;
  }

  /* ---------- UI build ---------- */
  function buildUI(root) {
    var header = el('div', 'cform-header');
    var k = el('p', 'cform-kicker'); k.textContent = 'Gratuita · 30 minuti';
    var t = el('h2', 'cform-title'); t.textContent = 'Prenota la Tua Consulenza';
    var d = el('p', 'cform-desc'); d.textContent = 'Scegli il giorno e l’orario che preferisci, inserisci i tuoi dati e ti aspettiamo in centro.';
    header.appendChild(k); header.appendChild(t); header.appendChild(d);

    // calendar
    var cal = el('div', 'cform-cal');
    var nav = el('div', 'cform-cal-nav');
    var prev = el('button', 'cform-arrow', { id: 'cform-prev', type: 'button', 'aria-label': 'Settimana precedente' });
    prev.innerHTML = '&#8249;';
    var range = el('div', 'cform-cal-range', { id: 'cform-range' });
    var next = el('button', 'cform-arrow', { id: 'cform-next', type: 'button', 'aria-label': 'Settimana successiva' });
    next.innerHTML = '&#8250;';
    nav.appendChild(prev); nav.appendChild(range); nav.appendChild(next);

    var days = el('div', 'cform-days', { id: 'cform-days' });
    var timesLabel = el('p', 'cform-times-label', { id: 'cform-times-label' });
    timesLabel.textContent = 'Orari disponibili';
    timesLabel.style.display = 'none';
    var times = el('div', '', { id: 'cform-times-wrap' });

    cal.appendChild(nav); cal.appendChild(days); cal.appendChild(timesLabel); cal.appendChild(times);

    // contact
    var error = el('div', 'cform-error', { id: 'cform-error' });
    var badge = el('span', 'cform-badge', { id: 'cform-badge' });
    var fields = el('div', 'cform-fields');
    fields.appendChild(makeField('cform-nome', 'Nome', 'text', 'Maria', 'given-name'));
    fields.appendChild(makeField('cform-cognome', 'Cognome', 'text', 'Rossi', 'family-name'));
    fields.appendChild(makeField('cform-tel', 'Telefono', 'tel', '+39 333 1234567', 'tel'));
    var submit = el('button', 'cform-submit', { id: 'cform-submit', type: 'button' });
    submit.textContent = 'Conferma la prenotazione';
    var contactTitle = el('h3', 'cform-contact-title'); contactTitle.textContent = 'I tuoi dati';
    var contact = el('div', 'cform-contact', { id: 'cform-contact' });
    contact.appendChild(contactTitle); contact.appendChild(badge); contact.appendChild(error);
    contact.appendChild(fields); contact.appendChild(submit);

    // success
    var success = el('div', 'cform-success', { id: 'cform-success' });
    var sIcon = el('div', 'cform-success-icon'); sIcon.textContent = '✓';
    var sTitle = el('h3', 'cform-success-title'); sTitle.textContent = 'Consulenza confermata';
    var sBody = el('p', 'cform-success-body', { id: 'cform-success-body' });
    success.appendChild(sIcon); success.appendChild(sTitle); success.appendChild(sBody);

    root.appendChild(header); root.appendChild(cal); root.appendChild(contact); root.appendChild(success);

    prev.addEventListener('click', function () { changeWeek(-1); });
    next.addEventListener('click', function () { changeWeek(1); });
    submit.addEventListener('click', handleSubmit);
  }

  /* ---------- calendar logic ---------- */
  function changeWeek(dir) {
    var candidate = addD(state.weekStart, dir * 7);
    if (dir < 0 && fmt(candidate) < fmt(mondayOf(state.today))) return; // niente passato
    state.weekStart = candidate;
    state.autoAdvance = 0;
    loadWeek();
  }

  function loadWeek() {
    var daysWrap = document.getElementById('cform-days');
    var timesWrap = document.getElementById('cform-times-wrap');
    var timesLabel = document.getElementById('cform-times-label');
    if (timesLabel) timesLabel.style.display = 'none';
    if (timesWrap) timesWrap.innerHTML = '';
    updateNav();
    if (daysWrap) {
      daysWrap.style.display = 'none';
    }
    showCalLoading(true);

    var fromStr = fmt(state.weekStart);
    state.loading = true;
    fetchWeek(fromStr).then(function (slots) {
      state.loading = false;
      showCalLoading(false);
      if (daysWrap) daysWrap.style.display = '';
      state.byDay = {};
      slots.forEach(function (s) {
        (state.byDay[s.giorno] = state.byDay[s.giorno] || []).push(s);
      });

      // settimana vuota -> avanza automaticamente (fino a un limite)
      if (!slots.length && state.autoAdvance < MAX_AUTO_ADVANCE) {
        state.autoAdvance++;
        state.weekStart = addD(state.weekStart, 7);
        loadWeek();
        return;
      }

      renderDays();
      // seleziona il primo giorno con disponibilità
      var first = firstAvailableDay();
      selectDay(first);
    }).catch(function () {
      state.loading = false;
      showCalLoading(false);
      if (daysWrap) { daysWrap.style.display = ''; daysWrap.innerHTML = ''; }
      var w = document.getElementById('cform-times-wrap');
      if (w) w.innerHTML = '<p class="cform-empty">Errore nel caricamento degli orari. Riprova o contattaci.</p>';
    });
  }

  function showCalLoading(on) {
    var existing = document.getElementById('cform-cal-loading');
    if (on) {
      if (existing) return;
      var ld = el('div', 'cform-loading', { id: 'cform-cal-loading' });
      ld.innerHTML = '<div class="cform-spinner"></div><span>Caricamento disponibilità...</span>';
      var daysWrap = document.getElementById('cform-days');
      daysWrap.parentNode.insertBefore(ld, daysWrap);
    } else if (existing) {
      existing.parentNode.removeChild(existing);
    }
  }

  function updateNav() {
    var range = document.getElementById('cform-range');
    var prev = document.getElementById('cform-prev');
    var ws = state.weekStart, we = addD(ws, 6);
    if (range) {
      var label;
      if (ws.getMonth() === we.getMonth()) {
        label = ws.getDate() + ' – ' + we.getDate() + ' ' + MON[we.getMonth()] + ' ' + we.getFullYear();
      } else {
        label = ws.getDate() + ' ' + MON[ws.getMonth()] + ' – ' + we.getDate() + ' ' + MON[we.getMonth()] + ' ' + we.getFullYear();
      }
      range.textContent = label;
    }
    if (prev) prev.disabled = fmt(ws) <= fmt(mondayOf(state.today));
  }

  function firstAvailableDay() {
    for (var i = 0; i < 7; i++) {
      var ds = fmt(addD(state.weekStart, i));
      if (state.byDay[ds] && state.byDay[ds].length) return ds;
    }
    return null;
  }

  function renderDays() {
    var wrap = document.getElementById('cform-days');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (var i = 0; i < 7; i++) {
      var day = addD(state.weekStart, i);
      var ds = fmt(day);
      var has = !!(state.byDay[ds] && state.byDay[ds].length);
      var past = ds < state.todayStr;
      var btn = el('button', 'cform-day', { type: 'button' });
      btn.disabled = !has || past;
      var wd = el('span', 'cform-day-wd'); wd.textContent = WD[day.getDay()];
      var num = el('span', 'cform-day-num'); num.textContent = day.getDate();
      btn.appendChild(wd); btn.appendChild(num);
      btn.setAttribute('data-day', ds);
      if (has && !past) {
        btn.addEventListener('click', (function (d) { return function () { selectDay(d); }; })(ds));
      }
      wrap.appendChild(btn);
    }
  }

  function selectDay(ds) {
    state.selectedDay = ds;
    var btns = document.querySelectorAll('.cform-day');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('cform-day-sel', btns[i].getAttribute('data-day') === ds);
    }
    renderTimes(ds);
  }

  function renderTimes(ds) {
    var wrap = document.getElementById('cform-times-wrap');
    var label = document.getElementById('cform-times-label');
    if (!wrap) return;
    wrap.innerHTML = '';
    var slots = ds ? (state.byDay[ds] || []) : [];
    if (!slots.length) {
      if (label) label.style.display = 'none';
      wrap.innerHTML = '<p class="cform-empty">Nessuno slot disponibile in questa settimana. Usa &#8250; per vedere la prossima.</p>';
      // nascondi form contatti se aperto
      var c = document.getElementById('cform-contact');
      if (c) c.classList.remove('cform-visible');
      state.selectedSlot = null;
      return;
    }
    if (label) label.style.display = '';
    var display = pickDisplaySlots(slots, ds);
    display.forEach(function (slot) {
      var b = el('button', 'cform-time', { type: 'button' });
      b.textContent = slot.ora;
      b.setAttribute('data-ora', slot.data_ora);
      b.addEventListener('click', function () { selectSlot(slot, b); });
      wrap.appendChild(b);
    });
  }

  function slotLabel(slot) {
    var dt = parseDateOnly(slot.giorno);
    return WD_FULL[dt.getDay()] + ' ' + dt.getDate() + ' ' + MON_FULL[dt.getMonth()] + ' · ' + slot.ora;
  }
  function parseDateOnly(ds) { var p = ds.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  // Hash deterministico di una stringa (FNV-1a) -> intero >= 0.
  function hashStr(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // Sceglie fino a MAX_PER_DAY slot distribuiti nella giornata (una per fascia),
  // l'orario esatto dentro ogni fascia dipende dalla DATA del giorno: vario tra
  // i giorni ma sempre identico per lo stesso giorno (deterministico, no random).
  function pickDisplaySlots(slots, giorno) {
    var n = slots.length;
    if (n <= MAX_PER_DAY) return slots.slice();
    var seen = {}, out = [];
    for (var b = 0; b < MAX_PER_DAY; b++) {
      var start = Math.floor(b * n / MAX_PER_DAY);
      var end = Math.floor((b + 1) * n / MAX_PER_DAY); // esclusivo
      if (end <= start) end = start + 1;
      var idx = start + (hashStr(giorno + ':' + b) % (end - start));
      var s = slots[idx];
      if (s && !seen[s.data_ora]) { seen[s.data_ora] = 1; out.push(s); }
    }
    return out;
  }

  function selectSlot(slot, btn) {
    var all = document.querySelectorAll('.cform-time.cform-time-sel');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('cform-time-sel');
    if (btn) btn.classList.add('cform-time-sel');
    state.selectedSlot = slot;
    var badge = document.getElementById('cform-badge');
    var contact = document.getElementById('cform-contact');
    var error = document.getElementById('cform-error');
    if (badge) badge.textContent = slotLabel(slot);
    if (error) { error.textContent = ''; error.classList.remove('cform-visible'); }
    if (contact) { contact.classList.add('cform-visible'); contact.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }

  /* ---------- booking ---------- */
  function handleSubmit() {
    var nome = (document.getElementById('cform-nome') || {}).value || '';
    var cognome = (document.getElementById('cform-cognome') || {}).value || '';
    var telefono = (document.getElementById('cform-tel') || {}).value || '';
    var error = document.getElementById('cform-error');
    var submit = document.getElementById('cform-submit');
    nome = nome.trim(); cognome = cognome.trim(); telefono = telefono.trim();
    if (!state.selectedSlot) { showErr(error, 'Seleziona prima un orario disponibile.'); return; }
    if (!nome) { showErr(error, 'Inserisci il tuo nome.'); return; }
    if (!cognome) { showErr(error, 'Inserisci il tuo cognome.'); return; }
    if (!telefono) { showErr(error, 'Inserisci il tuo numero di telefono.'); return; }
    if (submit) { submit.disabled = true; submit.textContent = 'Invio in corso...'; }
    showErr(error, '');

    var booked = state.selectedSlot;
    bookSlot(nome, cognome, telefono, booked.data_ora).then(function () {
      showSuccess(nome, slotLabel(booked));
    }).catch(function (e) {
      if (submit) { submit.disabled = false; submit.textContent = 'Conferma la prenotazione'; }
      if (e.code === 'slot_taken' || e.code === 'chiusura' || e.code === 'pausa_pranzo') {
        showErr(error, e.message + ' Gli orari sono stati aggiornati.');
        // ricarica la settimana corrente (invalida cache)
        delete weekCache[fmt(state.weekStart)];
        state.selectedSlot = null;
        var contact = document.getElementById('cform-contact');
        if (contact) contact.classList.remove('cform-visible');
        loadWeek();
      } else {
        showErr(error, e.message || 'Si è verificato un errore. Riprova.');
      }
    });
  }

  function showErr(elm, msg) {
    if (!elm) return;
    elm.textContent = msg;
    elm.classList.toggle('cform-visible', !!msg);
  }

  function showSuccess(nome, label) {
    var cal = document.querySelector('.cform-cal');
    var contact = document.getElementById('cform-contact');
    var success = document.getElementById('cform-success');
    var body = document.getElementById('cform-success-body');
    if (cal) cal.style.display = 'none';
    if (contact) contact.style.display = 'none';
    if (success) success.classList.add('cform-visible');
    if (body) body.textContent = 'Ciao ' + nome + ', la tua consulenza è confermata per ' + label + '. Ti aspettiamo!';
    if (success) success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- init ---------- */
  function init() {
    if (document.getElementById('cform-days')) return;
    var section = el('section', 'cform-section');
    var inner = el('div', 'cform-inner');
    section.appendChild(inner);
    var sections = document.querySelectorAll('section');
    var lastSec = sections[sections.length - 1];
    if (lastSec && lastSec.parentNode) {
      lastSec.parentNode.insertBefore(section, lastSec.nextSibling);
    } else {
      document.body.appendChild(section);
    }
    injectStyles();
    buildUI(inner);

    state.today = midnight(new Date());
    state.todayStr = fmt(state.today);
    state.weekStart = mondayOf(state.today);
    loadWeek();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
