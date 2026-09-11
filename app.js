/* Gimnasio — app. Vanilla JS, datos en localStorage. */
(function () {
  'use strict';
  const L = window.GymLogic;
  const KEY = 'gimnasio.v1', LIVE = 'gimnasio.live';
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal-root');
  const $toast = document.getElementById('toast-root');

  /* ================= Estado y persistencia ================= */
  function defaults() {
    return { version: 2, routines: [], sessions: [], settings: { sound: true, vibrate: true, wakeLock: true, voice: false, theme: 'system', lastRoutineId: null } };
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const base = defaults();
        const out = Object.assign(base, d, { settings: Object.assign(base.settings, d.settings || {}) });
        if (migrate(out)) persist(out);
        return out;
      }
    } catch (e) { /* datos corruptos: se ignoran */ }
    const d = defaults();
    const seed = window.GYM_SEED();
    d.routines = seed.routines; d.sessions = seed.sessions;
    persist(d);
    return d;
  }
  /* Rutinas guardadas antes de que existiera el RIR objetivo: se toma el de la rutina de ejemplo con el mismo id, o 2-3. */
  function migrateRoutines(routines) {
    let seed = null, changed = false;
    (routines || []).forEach(r => {
      if (r.rirMin != null && r.rirMax != null) return;
      seed = seed || window.GYM_SEED().routines;
      const s = seed.find(x => x.id === r.id);
      r.rirMin = s ? s.rirMin : 2; r.rirMax = s ? s.rirMax : 3; changed = true;
    });
    return changed;
  }
  /* Datos versión 2: rangos más cuidadosos con las articulaciones, motivo del rango y piso de RIR por ejercicio (ver applyRangeUpdates en logic.js). */
  function migrate(d) {
    let changed = migrateRoutines(d.routines);
    if (!(d.version >= 2)) { L.applyRangeUpdates(d.routines, window.GYM_SEED().routines); d.version = 2; changed = true; }
    return changed;
  }
  function persist(d) { try { localStorage.setItem(KEY, JSON.stringify(d || data)); } catch (e) { toast('No se pudo guardar (almacenamiento lleno o bloqueado)'); } }
  function loadLive() {
    try {
      const l = JSON.parse(localStorage.getItem(LIVE) || 'null');
      if (l && l.phase === 'rest') l.phase = 'exercise'; // versiones anteriores tenían una pantalla de descanso aparte
      if (l && l.sw && l.sw.total == null) l.sw = null; // cronómetro viejo, reemplazado por la cuenta regresiva
      if (l && !l.rir) l.rir = { min: 2, max: 3 }; // sesión empezada antes de la guía de progresión
      return l;
    } catch (e) { return null; }
  }
  function persistLive() { try { if (live) localStorage.setItem(LIVE, JSON.stringify(live)); else localStorage.removeItem(LIVE); } catch (e) { /* ignorar */ } }

  let data = load();
  let live = loadLive();
  const now = new Date();
  const ui = { tab: 'home', view: null, inSession: !!live, cal: { y: now.getFullYear(), m: now.getMonth(), sel: L.dateStr(now) }, editor: null, showExport: false };

  /* ================= Utilidades ================= */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
  const today = () => L.dateStr(new Date());
  const byId = (arr, id) => arr.find(x => x.id === id);
  function toast(msg, ms) {
    $toast.innerHTML = '<div class="toast">' + esc(msg) + '</div>';
    clearTimeout(toast.t); toast.t = setTimeout(() => { $toast.innerHTML = ''; }, ms || 1900);
  }
  function openModal(html) { $modal.innerHTML = '<div class="modal-bg" data-act="modalBg"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>'; }
  function closeModal() { $modal.innerHTML = ''; }
  function confirmModal(title, text, okLabel, onOk, danger) {
    confirmModal.cb = onOk;
    openModal('<h3 class="h2">' + esc(title) + '</h3><p class="muted">' + esc(text) + '</p>' +
      '<div class="actions"><button class="btn" data-act="closeModal">Cancelar</button><button class="btn ' + (danger ? 'danger' : 'primary') + '" data-act="confirmOk">' + esc(okLabel) + '</button></div>');
  }
  function applyTheme() {
    const t = data.settings.theme;
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  const feelChip = rir => { const f = L.feel(rir); return f ? '<span class="dot ' + f.cls + '" title="' + esc(f.label) + '"></span>' : ''; };
  const feelText = rir => { const f = L.feel(rir); return f ? f.label : 'sin sensación'; };
  const feelBtn = (f, on, act, target) => '<button class="feel ' + f.cls + (on ? ' on' : '') + (target ? ' target' : '') + '" data-act="' + act + '" data-rir="' + f.rir + '" title="' + esc(f.hint) + '"><span class="lbl">' + f.label + '</span><span class="rir">RIR ' + (f.rir === 4 ? '4+' : f.rir) + '</span></button>';
  function setChip(set, extraCls) {
    return '<span class="setchip ' + (extraCls || '') + '">' + esc(L.fmtSet(set)) + (set.perSide ? '<span class="muted small">/lado</span>' : '') + feelChip(set.rir) + '</span>';
  }

  /* ================= Render principal ================= */
  const ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>',
    routines: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    data: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
    up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>'
  };
  const TABS = [['home', 'Hoy'], ['routines', 'Rutinas'], ['calendar', 'Calendario'], ['data', 'Datos']];

  function render() {
    stopTimers();
    if (ui.inSession && live) { $app.innerHTML = renderSession(); afterSessionRender(); window.scrollTo(0, 0); return; }
    let html;
    if (ui.view && ui.view.name === 'session') html = renderSessionDetail(ui.view.id);
    else if (ui.view && ui.view.name === 'edit') html = renderEditor();
    else if (ui.tab === 'routines') html = renderRoutines();
    else if (ui.tab === 'calendar') html = renderCalendar();
    else if (ui.tab === 'data') html = renderData();
    else html = renderHome();
    $app.innerHTML = html + renderTabbar();
    releaseWakeLock();
  }
  function renderTabbar() {
    return '<nav class="tabbar"><div class="inner">' + TABS.map(([id, label]) =>
      '<button class="tab ' + (ui.tab === id && !ui.view ? 'active' : '') + '" data-act="tab" data-tab="' + id + '" aria-label="' + label + '">' + ICONS[id] + '<span>' + label + '</span></button>').join('') + '</div></nav>';
  }
  function topbar(title, right) {
    return '<header class="topbar"><h1 class="brand">' + esc(title) + '</h1>' + (right || '') + '</header>';
  }
  function statsGrid(st) {
    return '<div class="stats">' +
      '<div class="stat"><div class="n">' + st.thisWeek + '</div><div class="l">esta semana</div></div>' +
      '<div class="stat"><div class="n">' + st.last4 + '</div><div class="l">últimas 4 sem.</div></div>' +
      '<div class="stat"><div class="n">' + st.streak + '</div><div class="l">sem. seguidas</div></div>' +
      '<div class="stat"><div class="n">' + st.total + '</div><div class="l">días totales</div></div></div>';
  }
  function sessionRow(s) {
    const n = (s.sets || []).length;
    const dur = s.startedAt && s.endedAt ? L.fmtDuration(new Date(s.endedAt) - new Date(s.startedAt)) : '';
    return '<button class="row link" data-act="openSession" data-id="' + esc(s.id) + '"><div class="grow"><div class="title">' + esc(s.routineName || 'Sesión') + '</div>' +
      '<div class="sub">' + esc(L.fmtDateLong(s.date)) + (dur ? ' · ' + dur : '') + (s.manual ? ' · día marcado' : ' · ' + n + (n === 1 ? ' serie' : ' series')) + '</div></div><span class="chev">' + ICONS.right + '</span></button>';
  }

  /* ================= Hoy ================= */
  function renderHome() {
    const t = today();
    const st = L.stats(data.sessions, t);
    /* Próxima sesión: la última rutina que empezaste. Si no hay (datos viejos), la de la última sesión guardada; si no, se sugiere entre las activas. */
    const lastDone = L.sortSessions(data.sessions).find(s => s.routineId);
    const next = byId(data.routines, data.settings.lastRoutineId) || (lastDone && byId(data.routines, lastDone.routineId)) || L.suggestNext(data.routines, data.sessions);
    const recent = L.sortSessions(data.sessions).slice(0, 5);
    let html = '<div class="screen">' + topbar('Gimnasio', '<span class="date">' + esc(L.fmtDateLong(t)) + '</span>');
    if (live) {
      html += '<div class="card"><div class="eyebrow">Sesión en curso</div><div><b>' + esc(live.routineName) + '</b> <span class="muted">· empezada ' + esc(L.fmtTime(live.startedAt)) + ' · ' + live.sets.length + ' series anotadas</span></div>' +
        '<div class="actions"><button class="btn primary" data-act="resumeSession">Continuar</button><button class="btn danger" data-act="discardSession">Descartar</button></div></div>';
    }
    if (next) {
      const last = L.lastSessionOf(next.id, data.sessions);
      const sum = L.routineSummary(next);
      html += '<div class="card"><div class="eyebrow">Próxima sesión</div><h2 class="h2">' + esc(next.name) + '</h2>' +
        '<p class="muted">' + esc(next.subtitle || '') + (next.subtitle ? ' · ' : '') + sum.exercises + ' ejercicios · ' + sum.sets + ' series · ' + esc(L.rirLabel({ min: next.rirMin, max: next.rirMax })) +
        (last ? ' · última vez ' + esc(L.relDate(last.date, t)) : ' · todavía no la hiciste') + '</p>' +
        '<button class="btn primary big" data-act="startRoutine" data-id="' + esc(next.id) + '">Empezar</button>' +
        '<button class="btn ghost" data-act="pickRoutine">Elegir otra rutina</button></div>';
    } else {
      html += '<div class="card"><p class="muted">No hay rutinas. Creá una en la pestaña Rutinas.</p></div>';
    }
    html += statsGrid(st);
    html += '<div><div class="eyebrow" style="margin-bottom:8px">Últimas sesiones</div>' +
      (recent.length ? '<div class="list">' + recent.map(sessionRow).join('') + '</div>' : '<div class="empty">Todavía no hay sesiones guardadas.</div>') + '</div>';
    return html + '</div>';
  }

  /* ================= Calendario ================= */
  function renderCalendar() {
    const t = today();
    const y = ui.cal.y, m = ui.cal.m, sel = ui.cal.sel;
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const byDate = {};
    data.sessions.forEach(s => { (byDate[s.date] = byDate[s.date] || []).push(s); });
    let cells = [1, 2, 3, 4, 5, 6, 0].map(i => '<div class="dn">' + L.DAYS_SHORT[i] + '</div>').join('');
    for (let i = 0; i < lead; i++) cells += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = L.dateStr(new Date(y, m, d));
      const cls = ['d', 'in', ds === t ? 'today' : '', ds === sel ? 'sel' : '', byDate[ds] ? 'done' : ''].join(' ');
      cells += '<button class="' + cls + '" data-act="calSel" data-date="' + ds + '" aria-label="' + esc(L.fmtDateLong(ds)) + '">' + d + '<span class="dot"></span></button>';
    }
    const st = L.stats(data.sessions, t);
    const selSessions = byDate[sel] || [];
    let html = '<div class="screen">' + topbar('Calendario') +
      '<div class="card"><div class="cal-head"><button class="btn icon" data-act="calMove" data-n="-1" aria-label="Mes anterior">' + ICONS.left + '</button><div class="m">' + L.MONTHS[m] + ' ' + y + '</div><button class="btn icon" data-act="calMove" data-n="1" aria-label="Mes siguiente">' + ICONS.right + '</button></div>' +
      '<div class="cal">' + cells + '</div></div>';
    html += '<div class="card"><div class="card-head"><b>' + esc(L.fmtDateLong(sel)) + '</b>' + (sel === t ? '<span class="pill">hoy</span>' : '') + '</div>';
    if (selSessions.length) html += '<div class="list">' + selSessions.map(sessionRow).join('') + '</div>';
    else html += '<p class="muted">Sin entrenamiento registrado.</p>';
    if (sel <= t) html += '<button class="btn" data-act="markDay" data-date="' + sel + '">Marcar día entrenado</button>';
    html += '</div>';
    html += statsGrid(st);
    const max = Math.max(1, ...st.weeks.map(w => w.count));
    html += '<div class="card flat"><div class="eyebrow">Días por semana · últimas 12 semanas</div><div class="weeks">' +
      st.weeks.map((w, i) => '<div class="w ' + (w.count ? 'on' : '') + (i === 11 ? ' cur' : '') + '" style="height:' + (w.count ? Math.round(25 + 75 * w.count / max) : 9) + '%" title="' + w.count + ' (semana del ' + L.fmtDateShort(w.start) + ')"></div>').join('') + '</div></div>';
    return html + '</div>';
  }

  /* ================= Detalle de sesión ================= */
  function groupSets(sets) {
    const groups = [];
    sets.slice().sort((a, b) => a.stepIndex - b.stepIndex).forEach(set => {
      let g = groups.find(x => x.key === set.key);
      if (!g) { g = { key: set.key, name: set.name, sets: [] }; groups.push(g); }
      g.sets.push(set);
    });
    return groups;
  }
  function renderSessionDetail(id) {
    const s = byId(data.sessions, id);
    if (!s) { ui.view = null; return renderHome(); }
    const groups = groupSets(s.sets || []);
    const dur = s.startedAt && s.endedAt ? L.fmtDuration(new Date(s.endedAt) - new Date(s.startedAt)) : null;
    let html = '<div class="screen">' + topbar(s.routineName || 'Sesión', '<button class="btn sm" data-act="back">Volver</button>') +
      '<p class="muted">' + esc(L.fmtDateLong(s.date)) + (s.startedAt ? ' · ' + L.fmtTime(s.startedAt) + (s.endedAt ? '–' + L.fmtTime(s.endedAt) : '') : '') + (dur ? ' · ' + dur : '') + '</p>';
    if (s.note) html += '<div class="card flat"><div class="eyebrow">Nota</div><p>' + esc(s.note) + '</p></div>';
    if (groups.length) {
      html += '<div class="card">' + groups.map(g => '<div class="summary-ex"><div class="nm">' + esc(g.name) + '</div><div class="sets">' +
        g.sets.map(set => '<button class="setchip" data-act="editSet" data-sid="' + esc(s.id) + '" data-id="' + esc(set.id) + '">' + esc(L.fmtSet(set)) + (set.perSide ? '<span class="muted small">/lado</span>' : '') + feelChip(set.rir) + '</button>').join('') +
        '</div></div>').join('') + '<p class="small muted">Tocá una serie para corregirla.</p></div>';
    } else html += '<div class="card flat"><p class="muted">' + (s.manual ? 'Día marcado como entrenado, sin detalle de series.' : 'Sin series registradas.') + '</p></div>';
    html += '<div class="actions"><button class="btn" data-act="editNote" data-id="' + esc(s.id) + '">Editar nota</button><button class="btn danger" data-act="deleteSession" data-id="' + esc(s.id) + '">Eliminar sesión</button></div>';
    return html + '</div>';
  }

  /* ================= Datos ================= */
  function renderData() {
    const s = data.settings;
    const size = (localStorage.getItem(KEY) || '').length;
    const chk = (key, label) => '<label class="check"><input type="checkbox" data-setting="' + key + '" ' + (s[key] ? 'checked' : '') + '> ' + label + '</label>';
    let html = '<div class="screen">' + topbar('Datos');
    html += '<div class="card"><div class="eyebrow">Preferencias</div>' +
      chk('sound', 'Sonido al terminar el descanso o la cuenta regresiva') + chk('vibrate', 'Vibración') + chk('voice', 'Voz: anunciar el próximo ejercicio') + chk('wakeLock', 'Pantalla encendida durante la sesión') +
      '<div class="field"><label for="theme">Tema</label><select class="input" id="theme" data-setting="theme">' +
      [['system', 'Según el sistema'], ['dark', 'Oscuro'], ['light', 'Claro']].map(([v, l]) => '<option value="' + v + '"' + (s.theme === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div></div>';
    html += '<div class="card"><div class="eyebrow">Copia de seguridad</div><p class="small muted">Todo se guarda en este teléfono. Exportá cada tanto para no perder nada y para sacar estadísticas.</p>' +
      '<div class="actions"><button class="btn" data-act="copyExport">Copiar JSON</button><button class="btn" data-act="downloadExport">Descargar</button>' + (navigator.share ? '<button class="btn" data-act="shareExport">Compartir</button>' : '') + '</div>' +
      '<button class="btn ghost" data-act="toggleExport">' + (ui.showExport ? 'Ocultar el JSON' : 'Ver el JSON') + '</button>' +
      (ui.showExport ? '<textarea class="input export" readonly>' + esc(exportJSON()) + '</textarea>' : '') + '</div>';
    html += '<div class="card"><div class="eyebrow">Importar</div><p class="small muted">Pegá un JSON exportado por esta app o elegí el archivo. Reemplaza todo lo actual.</p>' +
      '<textarea class="input export" id="importText" placeholder="{ &quot;app&quot;: &quot;gimnasio&quot;, … }"></textarea>' +
      '<input type="file" id="importFile" accept="application/json,.json" class="input">' +
      '<button class="btn" data-act="importData">Importar</button></div>';
    html += '<div class="card flat"><div class="eyebrow">Mantenimiento</div>' +
      '<div class="kv"><span>Rutinas</span><b>' + data.routines.length + '</b></div><div class="kv"><span>Sesiones</span><b>' + data.sessions.length + '</b></div><div class="kv"><span>Tamaño de los datos</span><b>' + (Math.round(size / 102.4) / 10) + ' KB</b></div>' +
      '<div class="actions"><button class="btn" data-act="restoreSeed">Restaurar rutinas de ejemplo</button><button class="btn danger" data-act="wipe">Borrar todo</button></div></div>';
    html += '<div class="card flat"><div class="eyebrow">Instalar como app</div><p class="small muted">En Chrome para Android: menú ⋮ → «Instalar aplicación» o «Agregar a pantalla principal». Abre a pantalla completa y funciona sin internet.</p></div>';
    return html + '</div>';
  }
  function exportJSON() {
    return JSON.stringify({ app: 'gimnasio', version: data.version, exportedAt: new Date().toISOString(), routines: data.routines, sessions: data.sessions, settings: data.settings }, null, 1);
  }
  function importData(text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { toast('El texto no es un JSON válido'); return; }
    if (!obj || !Array.isArray(obj.routines) || !Array.isArray(obj.sessions)) { toast('El JSON no tiene rutinas y sesiones'); return; }
    confirmModal('Importar datos', 'Se reemplazan ' + data.routines.length + ' rutinas y ' + data.sessions.length + ' sesiones por ' + obj.routines.length + ' y ' + obj.sessions.length + '.', 'Importar', () => {
      const base = defaults();
      data = Object.assign(base, { version: obj.version || 1, routines: obj.routines, sessions: obj.sessions, settings: Object.assign(base.settings, obj.settings || {}) });
      migrate(data);
      persist(); applyTheme(); closeModal(); render(); toast('Datos importados');
    });
  }

  /* ================= Rutinas ================= */
  function renderRoutines() {
    let html = '<div class="screen">' + topbar('Rutinas', '<button class="btn sm primary" data-act="newRoutine">Nueva</button>');
    html += '<p class="small muted">En «Hoy» queda fijada la última rutina que empezaste; la cambiás con «Empezar» acá o con «Elegir otra rutina». Las activas solo se usan para sugerir una si todavía no empezaste ninguna.</p>';
    if (!data.routines.length) html += '<div class="empty">No hay rutinas todavía.</div>';
    else html += '<div class="list">' + data.routines.map(r => {
      const sum = L.routineSummary(r);
      return '<div class="row"><div class="grow"><div class="title">' + esc(r.name) + '</div><div class="sub">' + esc(r.subtitle || '') + (r.subtitle ? ' · ' : '') + sum.exercises + ' ejercicios · ' + sum.sets + ' series · ' + esc(L.rirLabel({ min: r.rirMin, max: r.rirMax })) + '</div>' +
        '<div class="actions" style="margin-top:8px"><button class="btn sm" data-act="startRoutine" data-id="' + esc(r.id) + '">Empezar</button><button class="btn sm" data-act="editRoutine" data-id="' + esc(r.id) + '">Editar</button>' +
        '<button class="btn sm ' + (r.active ? 'primary' : '') + '" data-act="toggleActive" data-id="' + esc(r.id) + '" aria-pressed="' + (r.active ? 'true' : 'false') + '">' + (r.active ? 'Activa' : 'Inactiva') + '</button></div></div></div>';
    }).join('') + '</div>';
    html += '<div class="card flat guide"><div class="eyebrow">Guía de rangos · estímulo alto, articulaciones cuidadas</div>' +
      [['Compuesto de pierna, día pesado (sentadilla, peso muerto)', '6-10 · RIR 2 mín.'], ['Compuesto de pierna, día moderado o reenganche', '8-12'], ['Unilateral de pierna (estocadas, búlgara)', '8-12 / pierna'],
       ['Empujes (banco, inclinado, press militar)', '8-12'], ['Empujes en reenganche', '10-15'], ['Tracción principal del día (remo, jalón)', '6-10'], ['Tracciones', '8-12'],
       ['Hombro aislado (laterales, face pull)', '12-15'], ['Brazos (curl, tríceps)', '10-15'], ['Puente de glúteo', '10-15'], ['Core isométrico y carry', '20-45″']]
        .map(([k, v]) => '<div class="kv"><span>' + k + '</span><b>' + v + '</b></div>').join('') +
      '<p class="small muted">Nunca menos de 6 reps con carga: por debajo, la carga sobre columna, rodillas y hombros sube mucho más que el estímulo. Cada ejercicio muestra su motivo en la sesión. Detalle y referencias en docs/rangos-de-repeticiones.pdf.</p></div>';
    return html + '</div>';
  }

  function blankExercise() { return { name: '', note: '', why: '', mode: 'reps', min: 8, max: 12, unit: 'kg', step: 2.5, perSide: false, target: 0, sets: 3, rest: 90, rirMin: null }; }
  function blankBlock() { return { id: L.uid('b'), type: 'circuit', name: 'Circuito', rounds: 3, restBetween: 45, restAfterRound: 90, exercises: [blankExercise()] }; }
  function move(arr, i, dir) { const j = i + dir; if (j < 0 || j >= arr.length) return; const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  function numOr(v, def) { const n = num(v); return n == null ? def : n; }

  function renderEditor() {
    const r = ui.editor.routine;
    const inp = (path, val, type, extra) => '<input class="input" type="' + (type || 'text') + '" ' + (type === 'number' ? 'inputmode="decimal" step="any" ' : '') + 'data-bind="' + path + '" value="' + esc(val == null ? '' : val) + '" ' + (extra || '') + '>';
    const sel = (path, val, opts) => '<select class="input" data-bind="' + path + '">' + opts.map(([v, l]) => '<option value="' + v + '"' + (String(val) === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select>';
    const fld = (label, inner) => '<div class="field"><label>' + label + '</label>' + inner + '</div>';
    let html = '<div class="screen">' + topbar(ui.editor.isNew ? 'Nueva rutina' : 'Editar rutina', '<button class="btn sm" data-act="cancelEdit">Cancelar</button>');
    html += '<div class="card">' + fld('Nombre', inp('name', r.name, 'text', 'placeholder="Ej.: Fase 2 · Día 1"')) + fld('Subtítulo', inp('subtitle', r.subtitle)) +
      fld('Calentamiento', '<textarea class="input" data-bind="warmup">' + esc(r.warmup) + '</textarea>') +
      fld('Notas', '<textarea class="input" data-bind="notes">' + esc(r.notes) + '</textarea>') +
      '<div class="grid2">' + fld('Exigencia · RIR mínimo', inp('rirMin', r.rirMin, 'number', 'min="0" max="4"')) + fld('RIR máximo', inp('rirMax', r.rirMax, 'number', 'min="0" max="4"')) + '</div>' +
      '<p class="small muted">RIR = reps que te quedan al terminar la serie. La guía de progresión evalúa cada serie contra este objetivo: 3-4 al reengancharte, 2-3 después, 1-2 en fases fuertes.</p>' +
      '<label class="check"><input type="checkbox" data-bind="active" ' + (r.active ? 'checked' : '') + '> Activa (entra en la sugerencia de próxima sesión)</label></div>';
    r.blocks.forEach((b, bi) => {
      const p = 'blocks.' + bi + '.';
      html += '<div class="block-card"><div class="bh">' + inp(p + 'name', b.name, 'text', 'placeholder="Nombre del bloque"') +
        '<button class="iconbtn" data-act="moveBlock" data-bi="' + bi + '" data-dir="-1" aria-label="Subir bloque">' + ICONS.up + '</button><button class="iconbtn" data-act="moveBlock" data-bi="' + bi + '" data-dir="1" aria-label="Bajar bloque">' + ICONS.down + '</button><button class="iconbtn" data-act="delBlock" data-bi="' + bi + '" aria-label="Eliminar bloque">' + ICONS.x + '</button></div>' +
        fld('Tipo', sel(p + 'type', b.type, [['circuit', 'Circuito / superset: una serie de cada ejercicio por vuelta'], ['straight', 'Series: todas las series de un ejercicio, luego el siguiente']]));
      if (b.type === 'circuit') html += '<div class="grid3">' + fld('Vueltas', inp(p + 'rounds', b.rounds, 'number')) + fld('Desc. entre ej. (s)', inp(p + 'restBetween', b.restBetween, 'number')) + fld('Desc. fin de vuelta (s)', inp(p + 'restAfterRound', b.restAfterRound, 'number')) + '</div>';
      b.exercises.forEach((ex, ei) => {
        const q = p + 'exercises.' + ei + '.';
        html += '<div class="ex-card"><div class="ttl">' + inp(q + 'name', ex.name, 'text', 'placeholder="Ejercicio"') +
          '<button class="iconbtn" data-act="moveEx" data-bi="' + bi + '" data-ei="' + ei + '" data-dir="-1" aria-label="Subir">' + ICONS.up + '</button><button class="iconbtn" data-act="moveEx" data-bi="' + bi + '" data-ei="' + ei + '" data-dir="1" aria-label="Bajar">' + ICONS.down + '</button><button class="iconbtn" data-act="delEx" data-bi="' + bi + '" data-ei="' + ei + '" aria-label="Eliminar">' + ICONS.x + '</button></div>' +
          fld('Detalle (ej.: «barra», «c/mano»)', inp(q + 'note', ex.note)) +
          '<div class="grid3">' + fld('Medida', sel(q + 'mode', ex.mode, [['reps', 'Reps'], ['time', 'Segundos']])) + fld('Mín.', inp(q + 'min', ex.min, 'number')) + fld('Máx.', inp(q + 'max', ex.max, 'number')) + '</div>' +
          fld('Por qué este rango (se muestra en la sesión)', inp(q + 'why', ex.why, 'text', 'placeholder="Ej.: compuesto pesado, 6-10 con RIR 2 mínimo"')) +
          '<div class="grid3">' + fld('Carga', sel(q + 'unit', ex.unit, [['kg', 'kg'], ['ladrillos', 'Ladrillos'], ['none', 'Sin carga']])) + fld('Objetivo', inp(q + 'target', ex.target, 'number')) + fld('Salto +/−', inp(q + 'step', ex.step, 'number')) + '</div>' +
          (b.type === 'straight' ? '<div class="grid2">' + fld('Series', inp(q + 'sets', ex.sets, 'number')) + fld('Descanso (s)', inp(q + 'rest', ex.rest, 'number')) + '</div>' : '') +
          fld('RIR mínimo propio (opcional · sentadilla y peso muerto: 2)', inp(q + 'rirMin', ex.rirMin, 'number', 'min="0" max="4" placeholder="el de la rutina"')) +
          '<label class="check"><input type="checkbox" data-bind="' + q + 'perSide" ' + (ex.perSide ? 'checked' : '') + '> Por lado (unilateral)</label></div>';
      });
      html += '<button class="btn sm" data-act="addEx" data-bi="' + bi + '">+ Ejercicio</button></div>';
    });
    html += '<button class="btn" data-act="addBlock">+ Bloque</button>';
    html += '<button class="btn primary big" data-act="saveRoutine">Guardar rutina</button>';
    if (!ui.editor.isNew) html += '<div class="actions"><button class="btn" data-act="duplicateRoutine">Duplicar</button><button class="btn danger" data-act="deleteRoutine">Eliminar rutina</button></div>';
    return html + '</div>';
  }
  function bindSet(obj, path, value) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) { if (o == null) return; o = o[parts[i]]; }
    if (o != null) o[parts[parts.length - 1]] = value;
  }
  function saveRoutine() {
    const r = ui.editor.routine;
    r.name = String(r.name || '').trim();
    if (!r.name) { toast('Poné un nombre a la rutina'); return; }
    r.rirMin = Math.min(4, Math.max(0, Math.round(numOr(r.rirMin, 2)))); r.rirMax = Math.min(4, Math.max(r.rirMin, Math.round(numOr(r.rirMax, r.rirMin))));
    const heavy = [];
    r.blocks.forEach(b => {
      b.name = String(b.name || '').trim() || (b.type === 'circuit' ? 'Circuito' : 'Series');
      b.rounds = Math.max(1, Math.round(numOr(b.rounds, 1)));
      b.restBetween = Math.max(0, numOr(b.restBetween, 0));
      b.restAfterRound = Math.max(0, numOr(b.restAfterRound, 0));
      b.exercises = b.exercises.filter(e => String(e.name || '').trim());
      b.exercises.forEach(e => {
        e.name = String(e.name).trim(); e.note = String(e.note || '').trim();
        e.min = Math.max(0, numOr(e.min, 8)); e.max = Math.max(e.min, numOr(e.max, e.min));
        e.target = Math.max(0, numOr(e.target, 0)); e.step = Math.max(0, numOr(e.step, e.unit === 'ladrillos' ? 1 : 2.5));
        e.sets = Math.max(1, Math.round(numOr(e.sets, 3))); e.rest = Math.max(0, numOr(e.rest, 60)); e.perSide = !!e.perSide;
        e.why = String(e.why || '').trim();
        const floor = num(e.rirMin); e.rirMin = floor == null ? null : Math.min(4, Math.max(0, Math.round(floor)));
        if (e.mode === 'reps' && e.min < 6) heavy.push(e.name);
      });
    });
    r.blocks = r.blocks.filter(b => b.exercises.length);
    if (!r.blocks.length) { toast('Agregá al menos un ejercicio con nombre'); return; }
    const i = data.routines.findIndex(x => x.id === r.id);
    if (i >= 0) data.routines[i] = r; else data.routines.push(r);
    persist(); ui.editor = null; ui.view = null; ui.tab = 'routines'; render();
    if (heavy.length) toast('Rutina guardada. Ojo: ' + heavy.join(', ') + ' por debajo de 6 reps carga mucho las articulaciones (ver guía de rangos).', 4500);
    else toast('Rutina guardada');
  }

  /* ================= Sesión en curso ================= */
  function startRoutine(id) {
    const r = byId(data.routines, id); if (!r) return;
    closeModal();
    if (live) {
      confirmModal('Ya hay una sesión en curso', 'Si empezás otra se descarta la sesión en curso (' + live.routineName + ').', 'Empezar igual', () => { live = null; persistLive(); closeModal(); startRoutine(id); }, true);
      return;
    }
    /* RIR objetivo de la sesión: el de la fase; si volvés después de 5 o más días, esa sesión va a RIR 3 (regla del programa). */
    const lastAny = L.sortSessions(data.sessions)[0];
    const away = lastAny ? L.daysBetween(L.parseDate(lastAny.date), new Date()) : null;
    const rir = away != null && away >= 5 ? { min: 3, max: 4, absence: away } : { min: r.rirMin != null ? r.rirMin : 2, max: r.rirMax != null ? r.rirMax : 3 };
    live = { id: L.uid('s'), routineId: r.id, routineName: r.name, routine: L.clone(r), rounds: r.blocks.map(b => b.rounds || 1), queue: [], idx: 0, phase: 'start',
      startedAt: new Date().toISOString(), sets: [], skipped: [], rest: null, draft: null, sw: null, note: '', rir, lastEval: null };
    data.settings.lastRoutineId = r.id; persist();
    ui.inSession = true; persistLive(); render();
  }
  function beginExercises() {
    live.queue = L.buildQueue(live.routine, live.rounds);
    if (!live.queue.length) { toast('La rutina no tiene ejercicios'); return; }
    live.phase = 'exercise'; live.idx = 0; live.draft = null; persistLive(); render();
  }
  function currentStep() { return live.queue[live.idx]; }
  function stepExercise(step) { return live.routine.blocks[step.block].exercises[step.ex]; }
  function loadStep(ex) { return ex.step || (ex.unit === 'ladrillos' ? 1 : 2.5); }
  /* RIR objetivo de un ejercicio en la sesión: el de la fase, salvo que el ejercicio tenga un piso propio más alto (sentadilla, peso muerto). */
  function rirFor(ex) { return L.exerciseTarget(live.rir, ex); }
  function ensureDraft() {
    if (live.draft && live.draft.stepIndex === live.idx) return live.draft;
    const step = currentStep(); const ex = stepExercise(step);
    const existing = live.sets.find(s => s.stepIndex === live.idx);
    const hist = L.exerciseHistory(data.sessions, step.key, { limit: 1 });
    const todaySets = live.sets.filter(s => s.key === step.key && s.stepIndex < live.idx).sort((a, b) => a.stepIndex - b.stepIndex);
    let load = null, reps = null, rir = null;
    if (existing) { load = existing.load; reps = existing.reps; rir = existing.rir; }
    else {
      /* Nunca arrancar vacío: carga = la de hoy, si no la de la última vez, si no el objetivo (0 vale: sin peso).
         Reps = lo último que anotaste hoy en este ejercicio; si es la primera serie de hoy, la misma serie de la última vez; si no, el piso del rango. */
      if (ex.unit !== 'none') {
        if (todaySets.length) load = todaySets[todaySets.length - 1].load;
        else if (hist[0] && hist[0].sets[hist[0].sets.length - 1].load != null) load = hist[0].sets[hist[0].sets.length - 1].load;
        else load = ex.target != null ? ex.target : null;
      }
      const lastMatch = hist[0] ? (hist[0].sets[todaySets.length] || hist[0].sets[hist[0].sets.length - 1]) : null;
      if (todaySets.length && todaySets[todaySets.length - 1].reps != null) reps = todaySets[todaySets.length - 1].reps;
      else if (lastMatch && lastMatch.reps != null) reps = lastMatch.reps;
      else reps = ex.min;
    }
    live.draft = { stepIndex: live.idx, load, reps, rir };
    return live.draft;
  }
  function whereLabel(step) {
    const block = live.routine.blocks[step.block];
    return block.type === 'circuit' ? 'vuelta ' + step.round + '/' + step.roundsTotal + ' · ejercicio ' + (step.ex + 1) + '/' + block.exercises.length : 'serie ' + step.setNo + '/' + step.setsTotal;
  }
  function sessionBar(label) {
    return '<div class="session-bar"><button class="btn sm ghost" data-act="exitSession">‹ Salir</button><span>' + esc(label) + '</span><span class="clock" id="clock">' + L.fmtSecs((Date.now() - new Date(live.startedAt)) / 1000) + '</span></div>';
  }
  function progressBar() { return '<div class="progress"><i style="width:' + Math.round(100 * live.idx / Math.max(1, live.queue.length)) + '%"></i></div>'; }

  function renderSession() {
    if (live.phase === 'start') return renderStart();
    if (live.phase === 'summary') return renderSummary();
    if (!currentStep()) { live.phase = 'summary'; return renderSummary(); }
    return renderExercise();
  }
  function renderStart() {
    const r = live.routine;
    let html = '<div class="session">' + sessionBar('Antes de empezar') + '<div><div class="eyebrow">Sesión</div><h2 class="title-lg">' + esc(r.name) + '</h2></div>';
    if (r.warmup) html += '<div class="card"><div class="eyebrow">Calentamiento</div><p class="warm">' + esc(r.warmup) + '</p></div>';
    if (r.notes) html += '<div class="card flat"><div class="eyebrow">Notas</div><p class="warm">' + esc(r.notes) + '</p></div>';
    const rr = live.rir;
    const floors = []; r.blocks.forEach(b => b.exercises.forEach(e => { if (e.rirMin != null && e.rirMin > rr.min && !floors.some(f => f.name === e.name)) floors.push(e); }));
    html += '<div class="card"><div class="eyebrow">Exigencia de hoy</div><p><b>' + esc(L.rirLabel(rr)) + '</b> · terminá cada serie pudiendo hacer ' + (rr.min === rr.max ? rr.min : rr.min + ' a ' + rr.max) + ' reps más, con técnica limpia. La guía evalúa cada serie contra esto.</p>' +
      (rr.absence ? '<p class="small warn-text">Volvés después de ' + rr.absence + ' días: hoy todo a RIR 3, sin buscar récords (la fase pide ' + esc(L.rirLabel({ min: r.rirMin, max: r.rirMax })) + '). Vale solo para esta sesión.</p>' : '') +
      (floors.length ? '<p class="small muted">Piso propio para cuidar columna y rodillas: ' + floors.map(e => '<b>' + esc(e.name) + '</b> nunca por debajo de RIR ' + e.rirMin).join(' · ') + '. La guía evalúa esas series contra ese piso.</p>' : '') + '</div>';
    html += '<div class="card"><div class="eyebrow">Hoy</div><div class="blocks">' + r.blocks.map((b, bi) =>
      '<div class="block-row"><div class="grow"><b>' + esc(b.name) + '</b><div class="small muted">' + esc(b.exercises.map(e => e.name).join(' · ')) + '</div></div>' +
      (b.type === 'circuit' ? '<div class="mini-stepper"><button data-act="rounds" data-bi="' + bi + '" data-d="-1" aria-label="Menos vueltas">−</button><b>' + live.rounds[bi] + '</b><button data-act="rounds" data-bi="' + bi + '" data-d="1" aria-label="Más vueltas">+</button></div>' : '') + '</div>').join('') +
      '</div><p class="small muted">' + L.buildQueue(r, live.rounds).length + ' series en total. Podés ajustar las vueltas si venís justo de tiempo.</p></div>';
    html += '<div class="spacer"></div><div class="stick"><button class="btn primary big" data-act="beginExercises">Empezar los ejercicios</button></div>';
    return html + '</div>';
  }
  function renderExercise() {
    const step = currentStep(); const ex = stepExercise(step); const d = ensureDraft();
    const hist = L.exerciseHistory(data.sessions, step.key, { limit: 3 });
    const todaySets = live.sets.filter(s => s.key === step.key && s.stepIndex !== live.idx).sort((a, b) => a.stepIndex - b.stepIndex);
    const nth = live.sets.filter(s => s.key === step.key && s.stepIndex < live.idx).length;
    const rir = rirFor(ex);
    const plan = L.exercisePlan(ex, rir, hist);
    const targetReps = L.setTarget(plan, nth);
    const ref = L.refSet(hist[0], nth);
    const block = live.routine.blocks[step.block];
    let html = '<div class="session">' + sessionBar('Serie ' + (live.idx + 1) + ' de ' + live.queue.length) + progressBar() + (live.rest ? restBar() : '');
    if (live.lastEval) html += '<div class="eval ' + live.lastEval.kind + '"><span class="eyebrow">Serie anterior · ' + esc(live.lastEval.title) + '</span><div>' + esc(live.lastEval.text) + '</div></div>';
    html += '<div><div class="ex-block">' + esc(block.name) + ' · ' + esc(whereLabel(step)) + '</div><h2 class="ex-name">' + esc(ex.name) + '</h2>' +
      '<div class="ex-meta">' + (ex.note ? '<span>' + esc(ex.note) + '</span>' : '') + '<span>' + esc(L.rangeLabel(ex)) + (ex.perSide ? ' por lado' : '') + '</span>' +
      (ex.unit !== 'none' && ex.target ? '<span>objetivo ' + esc(L.fmtLoad(ex.target, ex.unit)) + '</span>' : '') + (step.restAfter && live.idx < live.queue.length - 1 ? '<span>descanso ' + step.restAfter + '″</span>' : '') + '</div>' +
      (ex.why ? '<p class="ex-why">' + esc(ex.why) + '</p>' : '') + '</div>';
    const goal = (ex.unit !== 'none' && plan.load != null ? L.fmtLoad(plan.load, ex.unit) + (targetReps != null ? ' × ' : ' · ') : '') + (targetReps != null ? (ex.mode === 'time' ? targetReps + '″' : targetReps) : 'hasta ' + L.rirLabel(rir));
    html += '<div class="card plan ' + plan.kind + '"><div class="card-head"><span class="eyebrow">Objetivo · serie ' + (nth + 1) + ' · ' + esc(L.rirLabel(rir)) + (rir.floor ? ' (piso propio)' : '') + '</span>' +
      (ref ? '<span class="small muted">última vez ' + esc(L.fmtSet(ref)) + (ref.rir != null ? ' · RIR ' + ref.rir : '') + '</span>' : '') + '</div>' +
      '<div class="plan-goal">' + esc(goal) + '</div><p class="plan-text">' + esc(plan.text) + '</p>';
    html += '<div class="last"><span class="eyebrow">Última vez' + (hist[0] ? ' · ' + esc(L.relDate(hist[0].date, today())) : '') + '</span>';
    if (hist[0]) html += '<div class="sets">' + hist[0].sets.map(s => setChip(s)).join('') + '</div>';
    else html += '<p class="small muted">Primera vez que registrás este ejercicio.</p>';
    if (hist[1]) html += '<div class="small muted">Antes, ' + esc(L.relDate(hist[1].date, today())) + ': ' + hist[1].sets.map(s => esc(L.fmtSet(s))).join(' · ') + '</div>';
    html += '</div></div>';
    if (todaySets.length) html += '<div class="last"><span class="eyebrow">Hoy</span><div class="sets">' + todaySets.map(s => setChip(s, 'today')).join('') + '</div></div>';
    html += '<div class="card">';
    if (ex.unit !== 'none') html += '<div class="field"><label>' + (ex.unit === 'ladrillos' ? 'Ladrillos' : 'Peso (kg)') + '</label><div class="stepper"><button data-act="step" data-f="load" data-d="-1" aria-label="Menos">−</button><input type="number" inputmode="decimal" step="any" min="0" data-draft="load" value="' + (d.load == null ? '' : d.load) + '" placeholder="' + (ex.target || '') + '"><button data-act="step" data-f="load" data-d="1" aria-label="Más">+</button></div></div>';
    if (ex.mode === 'time' && live.sw) {
      const remaining = live.sw.total - (Date.now() - live.sw.startAt) / 1000;
      html += '<div class="field"><label>Cuenta regresiva · ' + live.sw.total + '″</label><div class="sw"><div class="count' + (remaining <= 5 ? ' soon' : '') + '" id="swcount">' + L.fmtSecs(remaining) + '</div><button class="btn" data-act="countdown">■ Parar</button></div></div>';
    } else {
      html += '<div class="field"><label>' + (ex.mode === 'time' ? 'Segundos' : 'Reps') + (ex.perSide ? ' (por lado)' : '') + '</label><div class="stepper"><button data-act="step" data-f="reps" data-d="-1" aria-label="Menos">−</button><input type="number" inputmode="numeric" step="1" min="0" data-draft="reps" value="' + (d.reps == null ? '' : d.reps) + '" placeholder="' + ex.min + '-' + ex.max + '"><button data-act="step" data-f="reps" data-d="1" aria-label="Más">+</button></div>' +
        (ex.mode === 'time' ? '<button class="btn sm" data-act="countdown">▶ Iniciar cuenta regresiva</button>' : '') + '</div>';
    }
    html += '<div class="field"><label>¿Cómo se sintió? · objetivo ' + esc(L.rirLabel(rir)) + '</label><div class="feels">' + L.FEELS.map(f => feelBtn(f, d.rir === f.rir, 'feel', L.effort(f.rir, rir) === 'ok')).join('') + '</div></div>';
    html += '</div>';
    html += '<div class="spacer"></div><div class="stick"><button class="btn primary big" data-act="saveSet">Guardar serie</button>' +
      '<div class="grid2"><button class="btn sm" data-act="prevStep"' + (live.idx === 0 ? ' disabled' : '') + '>‹ Anterior</button><button class="btn sm" data-act="postponeStep" title="Hacer el que sigue y volver a este">Hacer después ↷</button>' +
      '<button class="btn sm" data-act="skipStep">Saltar</button><button class="btn sm ghost" data-act="finishEarly">Terminar</button></div></div>';
    return html + '</div>';
  }
  /* Barra de descanso: va arriba de la pantalla del ejercicio siguiente, así no hay que pasar por una pantalla aparte. */
  function restBar() {
    const remaining = (live.rest.endAt - Date.now()) / 1000;
    return '<div class="restbar" id="restbar"><div class="grow"><div class="eyebrow">Descanso</div><div class="count' + (remaining <= 5 ? ' soon' : '') + '" id="count">' + L.fmtSecs(remaining) + '</div></div>' +
      '<div class="restbar-actions"><button class="btn sm" data-act="restAdd" data-s="-15">−15″</button><button class="btn sm" data-act="restAdd" data-s="15">+15″</button><button class="btn sm" data-act="restSkip">Omitir</button></div></div>';
  }
  function renderSummary() {
    const groups = groupSets(live.sets);
    let html = '<div class="session">' + sessionBar('Resumen') + '<div><div class="eyebrow">Sesión terminada</div><h2 class="title-lg">' + esc(live.routineName) + '</h2>' +
      '<p class="muted">' + L.fmtDuration(Date.now() - new Date(live.startedAt)) + ' · ' + live.sets.length + ' series' + (live.skipped.length ? ' · ' + live.skipped.length + ' saltadas' : '') + '</p></div>';
    const exByKey = key => { let found = null; live.routine.blocks.forEach(b => b.exercises.forEach(e => { if (!found && L.slug(e.name) === key) found = e; })); return found; };
    const effs = live.sets.map(s => L.effort(s.rir, rirFor(exByKey(s.key))));
    const cnt = k => effs.filter(e => e === k).length;
    if (live.sets.length) html += '<div class="card flat"><div class="eyebrow">Exigencia · objetivo ' + esc(L.rirLabel(live.rir)) + '</div><div class="small">' +
      cnt('ok') + ' series en objetivo · ' + cnt('hard') + ' más al límite · ' + cnt('easy') + ' con margen de sobra' + (cnt(null) ? ' · ' + cnt(null) + ' sin sensación' : '') + '</div></div>';
    html += '<div class="card">' + (groups.length ? groups.map(g => {
      const ex = exByKey(g.key); const v = ex ? L.exerciseVerdict(ex, rirFor(ex), g.sets, L.exerciseHistory(data.sessions, g.key, { limit: 2 })) : null;
      return '<div class="summary-ex"><div class="nm">' + esc(g.name) + '</div><div class="sets">' + g.sets.map(s => setChip(s)).join('') + '</div>' +
        (v ? '<div class="small muted">' + esc(v.text) + '</div><div class="small verdict ' + v.next.kind + '">Próxima: ' + esc(v.next.short) + '</div>' : '') + '</div>';
    }).join('') : '<p class="muted">No registraste series.</p>') + '</div>';
    html += '<div class="card"><div class="field"><label>Nota de la sesión (opcional)</label><textarea class="input" data-live="note" placeholder="Cómo te sentiste, dolores, tiempo disponible…">' + esc(live.note) + '</textarea></div></div>';
    html += '<div class="spacer"></div><div class="stick"><button class="btn primary big" data-act="saveSession">Guardar sesión</button><div class="actions"><button class="btn sm" data-act="backToExercises">‹ Seguir entrenando</button><button class="btn sm danger" data-act="discardSession">Descartar</button></div></div>';
    return html + '</div>';
  }

  function saveSet() {
    const step = currentStep(); const ex = stepExercise(step); const d = ensureDraft();
    if (live.sw) { d.reps = Math.min(live.sw.total, swElapsed()); live.sw = null; }
    if (ex.unit !== 'none' && d.load == null) { toast('Anotá la carga'); return; }
    if (d.reps == null) { toast(ex.mode === 'time' ? 'Anotá los segundos' : 'Anotá las reps'); return; }
    if (d.rir == null) {
      toast('Anotá cómo se sintió: sin la sensación la guía no puede evaluar la serie', 2600);
      const f = document.querySelector('.feels'); if (f) { f.classList.add('attention'); if (f.scrollIntoView) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }
    const set = { id: L.uid('x'), key: step.key, name: ex.name, mode: ex.mode, unit: ex.unit, perSide: !!ex.perSide, block: step.block, round: step.round, setNo: step.setNo, setsTotal: step.setsTotal,
      stepIndex: live.idx, load: ex.unit === 'none' ? null : d.load, reps: d.reps, rir: d.rir, t: new Date().toISOString() };
    const hist = L.exerciseHistory(data.sessions, step.key, { limit: 2 });
    const nth = live.sets.filter(s => s.key === step.key && s.stepIndex < live.idx).length;
    const rir = rirFor(ex);
    const ev = L.evaluateSet(ex, rir, set, L.refSet(hist[0], nth), L.setTarget(L.exercisePlan(ex, rir, hist), nth));
    live.lastEval = { title: ex.name + ' · ' + L.fmtSet(set), kind: ev.kind, text: ev.text };
    const i = live.sets.findIndex(s => s.stepIndex === live.idx);
    if (i >= 0) live.sets[i] = set; else live.sets.push(set);
    live.skipped = live.skipped.filter(x => x !== live.idx);
    advance(step.restAfter);
  }
  function advance(rest) {
    ensureAudio();
    live.draft = null; live.sw = null;
    if (live.idx >= live.queue.length - 1) { live.phase = 'summary'; live.rest = null; }
    else {
      live.idx++; live.phase = 'exercise';
      live.rest = rest > 0 ? { endAt: Date.now() + rest * 1000, total: rest, fired: false, spoken: false } : null;
    }
    persistLive(); render();
  }
  function skipStep() {
    if (!live.skipped.includes(live.idx)) live.skipped.push(live.idx);
    live.sets = live.sets.filter(s => s.stepIndex !== live.idx);
    live.lastEval = null;
    advance(0);
  }
  /* Hacer después: el ejercicio actual (o lo que queda de sus series) pasa detrás del que sigue; sirve cuando el aparato está ocupado.
     Como las series anotadas apuntan a la posición en la cola, se reindexan con el mapa que devuelve la lógica. */
  function postponeStep() {
    const r = L.postponeStep(live.queue, live.idx);
    if (!r) { toast('No hay otro ejercicio después de este'); return; }
    const remap = i => (r.map[i] != null ? r.map[i] : i);
    live.queue = r.queue;
    live.sets.forEach(s => { s.stepIndex = remap(s.stepIndex); });
    live.skipped = live.skipped.map(remap);
    live.draft = null; live.sw = null;
    if (live.rest) live.rest.spoken = false;
    persistLive(); render();
    const nm = (step, n) => stepExercise(step).name + (n > 1 ? ' (' + n + ' series)' : '');
    toast('Ahora: ' + nm(r.ahead, r.aheadCount) + ' · después: ' + nm(r.moved, r.movedCount), 3200);
  }
  function prevStep() { if (live.idx > 0) { live.idx--; live.phase = 'exercise'; live.rest = null; live.draft = null; live.sw = null; live.lastEval = null; persistLive(); render(); } }
  /* Fin del descanso (por tiempo u «Omitir»): se saca la barra sin volver a dibujar la pantalla, para no perder lo que se esté tipeando. */
  function endRest() {
    if (!live || !live.rest) return;
    live.rest = null; persistLive();
    const bar = document.getElementById('restbar'); if (bar) bar.remove();
  }
  function saveSession() {
    const started = new Date(live.startedAt);
    data.sessions.push({ id: live.id, date: L.dateStr(started), routineId: live.routineId, routineName: live.routineName, manual: false, startedAt: live.startedAt, endedAt: new Date().toISOString(),
      sets: live.sets.slice().sort((a, b) => a.stepIndex - b.stepIndex), note: live.note || '', rir: { min: live.rir.min, max: live.rir.max } });
    persist();
    live = null; persistLive(); ui.inSession = false; ui.tab = 'home'; ui.view = null;
    render(); toast('Sesión guardada. ¡Bien ahí!');
    if (data.settings.vibrate && navigator.vibrate) navigator.vibrate(80);
  }
  /* Cuenta regresiva para ejercicios por tiempo (plancha): se fija el objetivo en segundos, se inicia y avisa al terminar.
     Si se para antes, quedan anotados los segundos que se aguantaron. */
  function swElapsed() { return Math.round((Date.now() - live.sw.startAt) / 1000); }
  function toggleCountdown() {
    const ex = stepExercise(currentStep()); const d = ensureDraft();
    if (live.sw) { d.reps = Math.min(live.sw.total, swElapsed()); live.sw = null; }
    else {
      ensureAudio();
      if (!(d.reps > 0)) d.reps = ex.min;
      live.sw = { startAt: Date.now(), total: d.reps, fired: false, ticked: 0 };
    }
    persistLive(); render();
  }
  function tickCountdown() {
    if (!live || !live.sw) return;
    const remaining = live.sw.total - (Date.now() - live.sw.startAt) / 1000;
    const el = document.getElementById('swcount');
    if (el) { el.textContent = L.fmtSecs(remaining); el.className = 'count' + (remaining <= 5 ? ' soon' : ''); }
    const secs = Math.ceil(remaining);
    if (secs > 0 && secs <= 3 && live.sw.ticked !== secs) { live.sw.ticked = secs; tickBeep(); }
    if (remaining <= 0 && !live.sw.fired) {
      live.sw.fired = true;
      const d = ensureDraft(); d.reps = live.sw.total; live.sw = null; persistLive();
      alertUser(); render(); toast('¡Tiempo! ' + d.reps + '″ cumplidos', 2500);
    }
  }

  /* ---- Temporizadores, sonido, vibración, voz, pantalla ---- */
  let timers = [];
  function stopTimers() { timers.forEach(clearInterval); timers = []; }
  function afterSessionRender() {
    if (data.settings.wakeLock && live.phase !== 'summary') requestWakeLock();
    timers.push(setInterval(() => { const c = document.getElementById('clock'); if (c && live) c.textContent = L.fmtSecs((Date.now() - new Date(live.startedAt)) / 1000); }, 1000));
    if (live.phase === 'exercise' && live.rest) {
      timers.push(setInterval(tickRest, 250));
      if (!live.rest.spoken) {
        live.rest.spoken = true; persistLive();
        const step = currentStep(); const ex = stepExercise(step); const hist = L.exerciseHistory(data.sessions, step.key, { limit: 1 });
        announce('Siguiente: ' + ex.name + ', ' + (ex.mode === 'time' ? ex.min + ' a ' + ex.max + ' segundos' : ex.min + ' a ' + ex.max + ' repeticiones') +
          (hist[0] && hist[0].sets[0].load != null ? '. Última vez ' + L.fmtLoad(hist[0].sets[0].load, hist[0].sets[0].unit).replace('kg', 'kilos') : ''));
      }
    }
    if (live.phase === 'exercise' && live.sw) timers.push(setInterval(tickCountdown, 200));
  }
  function tickRest() {
    if (!live || !live.rest) return;
    const remaining = (live.rest.endAt - Date.now()) / 1000;
    const el = document.getElementById('count');
    if (el) { el.textContent = L.fmtSecs(remaining); el.className = 'count' + (remaining <= 5 ? ' soon' : ''); }
    if (remaining <= 0 && !live.rest.fired) { live.rest.fired = true; alertUser(); endRest(); }
  }
  let audio = null;
  function ensureAudio() {
    if (!data.settings.sound) return;
    try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) { audio = null; }
  }
  function beep() {
    if (!data.settings.sound || !audio) return;
    try {
      const t = audio.currentTime;
      [0, 0.18, 0.36].forEach((off, i) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = i === 2 ? 1046 : 880;
        g.gain.setValueAtTime(0.0001, t + off); g.gain.exponentialRampToValueAtTime(0.5, t + off + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.15);
        o.connect(g); g.connect(audio.destination); o.start(t + off); o.stop(t + off + 0.16);
      });
    } catch (e) { /* sin audio */ }
  }
  function tickBeep() {
    if (!data.settings.sound || !audio) return;
    try {
      const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = 'sine'; o.frequency.value = 660;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.1);
    } catch (e) { /* sin audio */ }
  }
  function alertUser() { beep(); if (data.settings.vibrate && navigator.vibrate) { try { navigator.vibrate([250, 100, 250, 100, 500]); } catch (e) { /* nada */ } } }
  function announce(text) {
    if (!data.settings.voice || !window.speechSynthesis) return;
    try { const u = new SpeechSynthesisUtterance(text); u.lang = 'es-AR'; u.rate = 1; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { /* sin voz */ }
  }
  let wakeLock = null;
  function requestWakeLock() {
    if (!('wakeLock' in navigator) || wakeLock) return;
    navigator.wakeLock.request('screen').then(wl => { wakeLock = wl; wl.addEventListener('release', () => { wakeLock = null; }); }).catch(() => { wakeLock = null; });
  }
  function releaseWakeLock() { if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; } }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (ui.inSession && live && data.settings.wakeLock && live.phase !== 'summary') requestWakeLock();
    if (live && live.rest) tickRest();
    if (live && live.sw) tickCountdown();
  });

  /* ================= Acciones ================= */
  let modalRir = null;
  const actions = {
    tab: d => { ui.tab = d.tab; ui.view = null; ui.editor = null; render(); },
    back: () => { ui.view = null; render(); },
    openSession: d => { closeModal(); ui.view = { name: 'session', id: d.id }; render(); },
    startRoutine: d => startRoutine(d.id),
    pickRoutine: () => openModal('<h3 class="h2">Elegir rutina</h3><div class="list">' + data.routines.map(r =>
      '<button class="row link" data-act="startRoutine" data-id="' + esc(r.id) + '"><div class="grow"><div class="title">' + esc(r.name) + '</div><div class="sub">' + esc(r.subtitle || '') + '</div></div><span class="chev">' + ICONS.right + '</span></button>').join('') +
      '</div><button class="btn" data-act="closeModal">Cancelar</button>'),
    resumeSession: () => { ui.inSession = true; render(); },
    discardSession: () => confirmModal('Descartar sesión', 'Se pierde lo anotado en esta sesión.', 'Descartar', () => { live = null; persistLive(); ui.inSession = false; closeModal(); render(); }, true),
    exitSession: () => { ui.inSession = false; ui.tab = 'home'; ui.view = null; render(); toast('La sesión sigue en curso. Volvé desde «Continuar».'); },
    rounds: d => { const bi = +d.bi; live.rounds[bi] = Math.max(1, Math.min(10, live.rounds[bi] + (+d.d))); persistLive(); render(); },
    beginExercises: beginExercises,
    step: d => {
      const ex = stepExercise(currentStep()); const dr = ensureDraft();
      const inp = document.querySelector('[data-draft="' + d.f + '"]'); if (!inp) return;
      const cur = num(inp.value);
      const inc = d.f === 'load' ? loadStep(ex) : (ex.mode === 'time' ? 5 : 1);
      let v = cur == null ? (d.f === 'load' ? (ex.target || 0) : ex.min) : cur + inc * (+d.d);
      v = Math.max(0, Math.round(v * 100) / 100);
      inp.value = v; dr[d.f] = v; persistLive();
    },
    feel: d => { const dr = ensureDraft(); dr.rir = dr.rir === +d.rir ? null : +d.rir; persistLive(); $app.querySelectorAll('.feel').forEach(b => b.classList.toggle('on', +b.dataset.rir === dr.rir)); },
    saveSet: saveSet, skipStep: skipStep, postponeStep: postponeStep, prevStep: prevStep,
    finishEarly: () => { live.phase = 'summary'; live.rest = null; live.sw = null; persistLive(); render(); },
    backToExercises: () => { live.phase = 'exercise'; if (live.idx >= live.queue.length) live.idx = live.queue.length - 1; live.draft = null; persistLive(); render(); },
    restAdd: d => { if (!live.rest) return; live.rest.endAt += (+d.s) * 1000; live.rest.fired = false; persistLive(); tickRest(); },
    restSkip: endRest,
    countdown: toggleCountdown,
    saveSession: saveSession,
    /* rutinas */
    newRoutine: () => { ui.editor = { isNew: true, routine: { id: L.uid('r'), name: '', subtitle: '', active: true, rirMin: 2, rirMax: 3, warmup: '', notes: '', blocks: [blankBlock()] } }; ui.view = { name: 'edit' }; render(); },
    editRoutine: d => { const r = byId(data.routines, d.id); if (!r) return; ui.editor = { isNew: false, routine: L.clone(r) }; ui.view = { name: 'edit' }; render(); },
    toggleActive: d => { const r = byId(data.routines, d.id); if (!r) return; r.active = !r.active; persist(); render(); },
    cancelEdit: () => { ui.editor = null; ui.view = null; render(); },
    addBlock: () => { ui.editor.routine.blocks.push(blankBlock()); render(); },
    delBlock: d => { ui.editor.routine.blocks.splice(+d.bi, 1); render(); },
    moveBlock: d => { move(ui.editor.routine.blocks, +d.bi, +d.dir); render(); },
    addEx: d => { ui.editor.routine.blocks[+d.bi].exercises.push(blankExercise()); render(); },
    delEx: d => { ui.editor.routine.blocks[+d.bi].exercises.splice(+d.ei, 1); render(); },
    moveEx: d => { move(ui.editor.routine.blocks[+d.bi].exercises, +d.ei, +d.dir); render(); },
    saveRoutine: saveRoutine,
    duplicateRoutine: () => { const c = L.clone(ui.editor.routine); c.id = L.uid('r'); c.name = c.name + ' (copia)'; c.blocks.forEach(b => { b.id = L.uid('b'); }); data.routines.push(c); persist(); ui.editor = { isNew: false, routine: L.clone(c) }; render(); toast('Rutina duplicada: estás editando la copia'); },
    deleteRoutine: () => confirmModal('Eliminar rutina', 'Las sesiones ya guardadas no se borran.', 'Eliminar', () => { data.routines = data.routines.filter(r => r.id !== ui.editor.routine.id); persist(); ui.editor = null; ui.view = null; closeModal(); render(); }, true),
    /* calendario */
    calMove: d => { let m = ui.cal.m + (+d.n), y = ui.cal.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } ui.cal.m = m; ui.cal.y = y; render(); },
    calSel: d => { ui.cal.sel = d.date; render(); },
    markDay: d => openModal('<h3 class="h2">Marcar día entrenado</h3><p class="muted">' + esc(L.fmtDateLong(d.date)) + '</p><div class="field"><label>Qué hiciste (opcional)</label><input class="input" id="markNote" placeholder="Ej.: fase 1, 3 vueltas"></div>' +
      '<div class="actions"><button class="btn" data-act="closeModal">Cancelar</button><button class="btn primary" data-act="markDayOk" data-date="' + d.date + '">Guardar</button></div>'),
    markDayOk: d => { const el = document.getElementById('markNote'); data.sessions.push({ id: L.uid('s'), date: d.date, routineId: null, routineName: 'Día marcado', manual: true, startedAt: null, endedAt: null, sets: [], note: el ? el.value : '' }); persist(); closeModal(); render(); toast('Día marcado'); },
    /* detalle de sesión */
    editSet: d => {
      const s = byId(data.sessions, d.sid); const set = s && byId(s.sets, d.id); if (!set) return;
      modalRir = set.rir;
      openModal('<h3 class="h2">' + esc(set.name) + '</h3><p class="muted">' + esc(L.fmtDateShort(s.date)) + ' · serie ' + set.setNo + '</p>' +
        (set.unit !== 'none' ? '<div class="field"><label>' + (set.unit === 'ladrillos' ? 'Ladrillos' : 'Peso (kg)') + '</label><input class="input" type="number" inputmode="decimal" step="any" id="esLoad" value="' + (set.load == null ? '' : set.load) + '"></div>' : '') +
        '<div class="field"><label>' + (set.mode === 'time' ? 'Segundos' : 'Reps') + '</label><input class="input" type="number" inputmode="numeric" id="esReps" value="' + (set.reps == null ? '' : set.reps) + '"></div>' +
        '<div class="field"><label>Sensación</label><div class="feels">' + L.FEELS.map(f => feelBtn(f, set.rir === f.rir, 'feelModal')).join('') + '</div></div>' +
        '<div class="actions"><button class="btn" data-act="closeModal">Cancelar</button><button class="btn danger" data-act="delSet" data-sid="' + esc(s.id) + '" data-id="' + esc(set.id) + '">Borrar</button><button class="btn primary" data-act="editSetOk" data-sid="' + esc(s.id) + '" data-id="' + esc(set.id) + '">Guardar</button></div>');
    },
    feelModal: d => { modalRir = modalRir === +d.rir ? null : +d.rir; $modal.querySelectorAll('.feel').forEach(b => b.classList.toggle('on', +b.dataset.rir === modalRir)); },
    editSetOk: d => {
      const s = byId(data.sessions, d.sid); const set = s && byId(s.sets, d.id); if (!set) return;
      const l = document.getElementById('esLoad'); if (l) set.load = num(l.value);
      set.reps = num(document.getElementById('esReps').value); set.rir = modalRir;
      persist(); closeModal(); render(); toast('Serie corregida');
    },
    delSet: d => { const s = byId(data.sessions, d.sid); if (!s) return; s.sets = s.sets.filter(x => x.id !== d.id); persist(); closeModal(); render(); },
    editNote: d => { const s = byId(data.sessions, d.id); if (!s) return; openModal('<h3 class="h2">Nota</h3><textarea class="input" id="noteText">' + esc(s.note || '') + '</textarea><div class="actions"><button class="btn" data-act="closeModal">Cancelar</button><button class="btn primary" data-act="editNoteOk" data-id="' + esc(s.id) + '">Guardar</button></div>'); },
    editNoteOk: d => { const s = byId(data.sessions, d.id); if (!s) return; s.note = document.getElementById('noteText').value; persist(); closeModal(); render(); },
    deleteSession: d => confirmModal('Eliminar sesión', 'Se borra del calendario y del historial.', 'Eliminar', () => { data.sessions = data.sessions.filter(s => s.id !== d.id); persist(); ui.view = null; closeModal(); render(); }, true),
    /* datos */
    copyExport: () => { navigator.clipboard.writeText(exportJSON()).then(() => toast('JSON copiado al portapapeles')).catch(() => { ui.showExport = true; render(); toast('No se pudo copiar: seleccioná el texto a mano'); }); },
    downloadExport: () => {
      const blob = new Blob([exportJSON()], { type: 'application/json' }); const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'gimnasio-' + today() + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    },
    shareExport: () => {
      const name = 'gimnasio-' + today() + '.json';
      try {
        const file = new File([exportJSON()], name, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: 'Gimnasio' }).catch(() => {});
        else navigator.share({ title: 'Gimnasio', text: exportJSON() }).catch(() => {});
      } catch (e) { toast('Este navegador no puede compartir archivos'); }
    },
    toggleExport: () => { ui.showExport = !ui.showExport; render(); },
    importData: () => {
      const f = document.getElementById('importFile'); const t = document.getElementById('importText');
      if (f && f.files && f.files[0]) { const r = new FileReader(); r.onload = () => importData(r.result); r.readAsText(f.files[0]); }
      else importData(t ? t.value : '');
    },
    restoreSeed: () => confirmModal('Restaurar rutinas de ejemplo', 'Las rutinas de ejemplo que ya tenés se reemplazan por la versión actual (rangos, motivos, notas y pisos de RIR); se conserva si estaban activas. Las rutinas que creaste vos y las sesiones no se tocan.', 'Restaurar', () => {
      const seed = window.GYM_SEED(); let added = 0, updated = 0;
      seed.routines.forEach(r => { const i = data.routines.findIndex(x => x.id === r.id); if (i >= 0) { r.active = data.routines[i].active; data.routines[i] = r; updated++; } else { data.routines.push(r); added++; } });
      persist(); closeModal(); render(); toast(updated + ' actualizada(s) · ' + added + ' agregada(s)', 2600);
    }),
    wipe: () => confirmModal('Borrar todo', 'Se borran rutinas, sesiones y preferencias de este teléfono. Exportá antes si querés conservar algo.', 'Borrar todo', () => {
      localStorage.removeItem(KEY); localStorage.removeItem(LIVE); live = null; ui.inSession = false; data = load(); applyTheme(); closeModal(); render(); toast('Datos borrados; rutinas de ejemplo restauradas');
    }, true),
    /* modal */
    closeModal: closeModal,
    modalBg: (d, el, e) => { if (e.target === el) closeModal(); },
    confirmOk: () => { const cb = confirmModal.cb; confirmModal.cb = null; if (cb) cb(); }
  };

  function onClick(e) {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = actions[el.dataset.act]; if (!fn) return;
    if (el.tagName === 'A') e.preventDefault();
    fn(el.dataset, el, e);
  }
  $app.addEventListener('click', onClick);
  $modal.addEventListener('click', onClick);
  $app.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.draft && live) { const d = ensureDraft(); d[el.dataset.draft] = num(el.value); persistLive(); }
    else if (el.dataset.live && live) { live[el.dataset.live] = el.value; persistLive(); }
    else if (el.dataset.bind && ui.editor) { bindSet(ui.editor.routine, el.dataset.bind, el.type === 'checkbox' ? el.checked : el.type === 'number' ? num(el.value) : el.value); }
  });
  $app.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.setting) { data.settings[el.dataset.setting] = el.type === 'checkbox' ? el.checked : el.value; persist(); applyTheme(); return; }
    if (el.dataset.bind && ui.editor) {
      bindSet(ui.editor.routine, el.dataset.bind, el.type === 'checkbox' ? el.checked : el.type === 'number' ? num(el.value) : el.value);
      if (/\.(type|unit|mode)$/.test(el.dataset.bind)) render();
    }
  });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  applyTheme();
  render();
  window.GymApp = { render, get data() { return data; }, get live() { return live; } };
})();
