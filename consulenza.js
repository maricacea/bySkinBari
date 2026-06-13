(function () {
  'use strict';

  var SUPA_URL = 'https://jspdwpeepjroleorelbw.supabase.co';
  var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcGR3cGVlcGpyb2xlb3JlbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTMzODQsImV4cCI6MjA5MjYyOTM4NH0.D0NXPMI9IYSzdhz8qqjMLeCWgNAY4YQqyMwyHyzj6vQ';
  var DURATION  = 30;
  var SLOTS_N   = 8;

  var apiHeaders = {
    'Content-Type': 'application/json',
    'apikey': ANON_KEY,
    'Authorization': 'Bearer ' + ANON_KEY
  };

  var selectedSlot = null;
  var lastSlot     = null;

  function fetchSlots(cursor) {
    var body = { from_date: new Date().toISOString(), duration_minutes: DURATION, count: SLOTS_N };
    if (cursor) body.slot_cursor = cursor;
    return fetch(SUPA_URL + '/functions/v1/get-available-slots', {
      method: 'POST', headers: apiHeaders, body: JSON.stringify(body)
    }).then(function(r){ return r.json(); }).then(function(d){ return d.slots || []; });
  }

  function bookSlot(nome, cognome, telefono, data_ora) {
    return fetch(SUPA_URL + '/functions/v1/book-consultation', {
      method: 'POST', headers: apiHeaders,
      body: JSON.stringify({ nome: nome, cognome: cognome, telefono: telefono, data_ora: data_ora })
    }).then(function(r) {
      return r.json().then(function(d) {
        if (!r.ok) { var e = new Error(d.message || d.error || 'Errore'); e.code = d.error; throw e; }
        return d;
      });
    });
  }

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
      '.cform-slots-label{font-family:var(--f-body,"Outfit",sans-serif);font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-muted,#7A7570);margin-bottom:1rem}',
      '.cform-slots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:.75rem;margin-bottom:1.5rem}',
      '.cform-slot-btn{font-family:var(--f-body,"Outfit",sans-serif);font-size:.875rem;font-weight:500;padding:.875rem 1rem;background:var(--surface,#FDFAF6);border:1.5px solid var(--gold-pale,#E8D5B0);color:var(--ink,#1A1814);cursor:pointer;text-align:center;transition:all 180ms;line-height:1.3;width:100%}',
      '.cform-slot-btn:hover{border-color:var(--gold,#B8965A);background:rgba(184,150,90,.06)}',
      '.cform-slot-btn.cform-selected{background:var(--gold,#B8965A);border-color:var(--gold,#B8965A);font-weight:600}',
      '.cform-more-btn{font-family:var(--f-body,"Outfit",sans-serif);font-size:.75rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:.75rem 1.5rem;background:transparent;border:1px solid rgba(26,24,20,.18);color:var(--ink-muted,#7A7570);cursor:pointer;transition:all 180ms;display:none;margin-bottom:2.5rem}',
      '.cform-more-btn:hover{color:var(--ink,#1A1814);border-color:rgba(26,24,20,.35)}',
      '.cform-contact{display:none}.cform-contact.cform-visible{display:block}',
      '.cform-contact-title{font-family:var(--f-display,"Cormorant",Georgia,serif);font-size:1.5rem;font-weight:300;color:var(--ink,#1A1814);margin-bottom:1.25rem}',
      '.cform-badge{display:inline-block;font-family:var(--f-body,"Outfit",sans-serif);font-size:.8125rem;font-weight:600;background:var(--gold,#B8965A);color:var(--ink,#1A1814);padding:.4rem .875rem;margin-bottom:1.5rem}',
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
      '.cform-success-body{font-family:var(--f-body,"Outfit",sans-serif);font-size:1rem;color:var(--ink-soft,#4A4540);line-height:1.7;max-width:440px;margin:0 auto}',
      '.cform-loading{display:flex;gap:.5rem;align-items:center;font-family:var(--f-body,"Outfit",sans-serif);font-size:.875rem;color:var(--ink-muted,#7A7570);padding:1.5rem 0}',
      '.cform-spinner{width:1rem;height:1rem;border:2px solid var(--gold-pale,#E8D5B0);border-top-color:var(--gold,#B8965A);border-radius:50%;animation:cfspin .7s linear infinite}',
      '@keyframes cfspin{to{transform:rotate(360deg)}}'
    ].join('');
    document.head.appendChild(s);
  }

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k){ el.setAttribute(k, attrs[k]); });
    if (typeof children === 'string') el.innerHTML = children;
    else if (Array.isArray(children)) children.forEach(function(c){ if (c) el.appendChild(c); });
    return el;
  }

  function txt(tag, cls, text) {
    var el = document.createElement(tag);
    el.className = cls;
    el.textContent = text;
    return el;
  }

  function buildUI(root) {
    var header = h('div', {class:'cform-header'}, [
      txt('p','cform-kicker','Gratuita · 30 minuti'),
      txt('h2','cform-title','Prenota la Tua Consulenza'),
      txt('p','cform-desc','Scegli uno slot disponibile, inserisci i tuoi dati e ti aspettiamo in centro.')
    ]);
    var slotsLabel = txt('p','cform-slots-label','Disponibilità');
    var slotsGrid = h('div',{id:'cform-grid',class:'cform-slots-grid'},
      [h('div',{class:'cform-loading'},[h('div',{class:'cform-spinner'}),txt('span','','Caricamento orari...')])]
    );
    var moreBtn = h('button',{class:'cform-more-btn',id:'cform-more'},'Mostra altri orari');

    var errorDiv = h('div',{class:'cform-error',id:'cform-error'});
    var badge    = h('span',{class:'cform-badge',id:'cform-badge'});
    var fNome    = makeField('cform-nome','Nome','text','Maria','given-name');
    var fCognome = makeField('cform-cognome','Cognome','text','Rossi','family-name');
    var fTel     = makeField('cform-tel','Telefono','tel','+39 333 1234567','tel');
    var submitBtn = h('button',{class:'cform-submit',id:'cform-submit'},'Conferma la prenotazione');
    var fields = h('div',{class:'cform-fields'},[fNome,fCognome,fTel]);
    var contact = h('div',{class:'cform-contact',id:'cform-contact'},[
      txt('h3','cform-contact-title','I tuoi dati'),
      badge, errorDiv, fields, submitBtn
    ]);

    var successIcon  = h('div',{class:'cform-success-icon'},'✓');
    var successTitle = txt('h3','cform-success-title','Consulenza confermata');
    var successBody  = txt('p','cform-success-body','');
    successBody.id = 'cform-success-body';
    var success = h('div',{class:'cform-success',id:'cform-success'},[successIcon,successTitle,successBody]);

    [header,slotsLabel,slotsGrid,moreBtn,contact,success].forEach(function(el){ root.appendChild(el); });

    moreBtn.addEventListener('click', function(){ loadSlots(lastSlot, true); });
    submitBtn.addEventListener('click', handleSubmit);
  }

  function makeField(id, label, type, placeholder, autocomplete) {
    var wrap = document.createElement('div'); wrap.className = 'cform-field';
    var lbl  = document.createElement('label'); lbl.htmlFor = id; lbl.textContent = label;
    var inp  = document.createElement('input');
    inp.id = id; inp.type = type; inp.placeholder = placeholder;
    inp.autocomplete = autocomplete; inp.required = true;
    wrap.appendChild(lbl); wrap.appendChild(inp);
    return wrap;
  }

  function renderSlots(grid, slots, append) {
    if (!append) grid.innerHTML = '';
    if (!slots.length && !append) {
      grid.textContent = 'Nessuna disponibilità trovata. Riprova più tardi o chiamaci.';
      return;
    }
    slots.forEach(function(slot) {
      var btn = document.createElement('button');
      btn.className = 'cform-slot-btn';
      btn.textContent = slot.label;
      btn.addEventListener('click', function(){ selectSlot(slot, btn); });
      grid.appendChild(btn);
    });
  }

  function selectSlot(slot, btn) {
    document.querySelectorAll('.cform-slot-btn.cform-selected').forEach(function(b){ b.classList.remove('cform-selected'); });
    btn.classList.add('cform-selected');
    selectedSlot = slot;
    var badge   = document.getElementById('cform-badge');
    var contact = document.getElementById('cform-contact');
    var error   = document.getElementById('cform-error');
    if (badge)   { badge.textContent = slot.label; }
    if (error)   { error.textContent = ''; error.classList.remove('cform-visible'); }
    if (contact) { contact.classList.add('cform-visible'); contact.scrollIntoView({behavior:'smooth',block:'nearest'}); }
  }

  function loadSlots(cursor, append) {
    var grid = document.getElementById('cform-grid');
    var more = document.getElementById('cform-more');
    if (!grid) return;
    if (!append) grid.innerHTML = '<div class="cform-loading"><div class="cform-spinner"></div><span>Caricamento orari...</span></div>';
    if (more) more.disabled = true;
    fetchSlots(cursor).then(function(slots) {
      if (slots.length) lastSlot = slots[slots.length - 1].data_ora;
      renderSlots(grid, slots, append);
      if (more) { more.style.display = slots.length >= SLOTS_N ? 'block' : 'none'; more.disabled = false; }
    }).catch(function() {
      if (grid) grid.innerHTML = '<p style="color:#dc2626;font-size:.875rem">Errore nel caricamento degli orari. Riprova o contattaci.</p>';
    });
  }

  function handleSubmit() {
    var nome     = (document.getElementById('cform-nome') || {}).value || '';
    var cognome  = (document.getElementById('cform-cognome') || {}).value || '';
    var telefono = (document.getElementById('cform-tel') || {}).value || '';
    var error    = document.getElementById('cform-error');
    var submit   = document.getElementById('cform-submit');
    nome = nome.trim(); cognome = cognome.trim(); telefono = telefono.trim();
    if (!selectedSlot) { showErr(error, 'Seleziona prima un orario disponibile.'); return; }
    if (!nome)          { showErr(error, 'Inserisci il tuo nome.'); return; }
    if (!cognome)       { showErr(error, 'Inserisci il tuo cognome.'); return; }
    if (!telefono)      { showErr(error, 'Inserisci il tuo numero di telefono.'); return; }
    if (submit) { submit.disabled = true; submit.textContent = 'Invio in corso...'; }
    showErr(error, '');
    bookSlot(nome, cognome, telefono, selectedSlot.data_ora).then(function() {
      showSuccess(nome, selectedSlot.label);
    }).catch(function(e) {
      if (submit) { submit.disabled = false; submit.textContent = 'Conferma la prenotazione'; }
      if (e.code === 'slot_taken') {
        showErr(error, e.message + ' Gli orari sono stati aggiornati.');
        selectedSlot = null;
        document.querySelectorAll('.cform-slot-btn.cform-selected').forEach(function(b){ b.classList.remove('cform-selected'); });
        var contact = document.getElementById('cform-contact');
        if (contact) contact.classList.remove('cform-visible');
        loadSlots(null, false);
      } else {
        showErr(error, e.message || 'Si è verificato un errore. Riprova.');
      }
    });
  }

  function showErr(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('cform-visible', !!msg);
  }

  function showSuccess(nome, slotLabel) {
    var grid    = document.getElementById('cform-grid');
    var more    = document.getElementById('cform-more');
    var contact = document.getElementById('cform-contact');
    var success = document.getElementById('cform-success');
    var body    = document.getElementById('cform-success-body');
    var sLabel  = document.querySelector('.cform-slots-label');
    [grid,more,contact].forEach(function(el){ if(el) el.style.display='none'; });
    if (sLabel) sLabel.style.display = 'none';
    if (success) success.classList.add('cform-visible');
    if (body) body.textContent = 'Ciao ' + nome + ', la tua consulenza è confermata per ' + slotLabel + '. Ti aspettiamo!';
  }

  function init() {
    // Auto-inject the section before the last <section> or at end of body
    if (!document.getElementById('cform-grid')) {
      var section = document.createElement('section');
      section.className = 'cform-section';
      var inner = document.createElement('div');
      inner.className = 'cform-inner';
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
      loadSlots(null, false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();