/* Lógica pura (sin DOM): fechas, formatos, cola de series, historial, progresión, estadísticas. */
window.GymLogic = (function () {
  const FEELS = [
    { rir: 4, label: 'Liviano', hint: 'podía hacer 4 o más', emoji: '😌', cls: 'f4' },
    { rir: 3, label: 'Cómodo', hint: 'podía hacer 3 más', emoji: '🙂', cls: 'f3' },
    { rir: 2, label: 'Justo', hint: 'podía hacer 2 más', emoji: '😐', cls: 'f2' },
    { rir: 1, label: 'Pesado', hint: 'podía hacer 1 más', emoji: '😤', cls: 'f1' },
    { rir: 0, label: 'Al límite', hint: 'ninguna más / fallo', emoji: '🥵', cls: 'f0' }
  ];
  function feel(rir) { return FEELS.find(f => f.rir === rir) || null; }

  function slug(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function uid(prefix) { return (prefix || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /* ---- Fechas (siempre en hora local) ---- */
  function pad2(n) { return String(n).padStart(2, '0'); }
  function dateStr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function parseDate(s) { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
  function startOfWeek(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() + 6) % 7)); }
  function daysBetween(a, b) {
    const A = new Date(a.getFullYear(), a.getMonth(), a.getDate()), B = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((B - A) / 86400000);
  }
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fmtDateLong(s) { const d = parseDate(s); return DAYS[d.getDay()] + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()]; }
  function fmtDateShort(s) { const d = parseDate(s); return DAYS_SHORT[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1); }
  function relDate(s, today) {
    const n = daysBetween(parseDate(s), parseDate(today));
    if (n === 0) return 'hoy';
    if (n === 1) return 'ayer';
    if (n > 1 && n < 7) return 'hace ' + n + ' días';
    return fmtDateShort(s);
  }
  function fmtTime(iso) { if (!iso) return ''; const d = new Date(iso); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }

  /* ---- Formatos ---- */
  function fmtNum(n) { if (n == null || isNaN(n)) return '—'; return String(Math.round(n * 100) / 100).replace('.', ','); }
  function fmtLoad(load, unit) {
    if (unit === 'none') return '';
    if (load == null || isNaN(load)) return '?';
    if (unit === 'kg') return load === 0 ? 'sin peso' : fmtNum(load) + ' kg';
    if (unit === 'ladrillos') return fmtNum(load) + (load === 1 ? ' ladrillo' : ' ladrillos');
    return fmtNum(load);
  }
  function unitLabel(unit) { return unit === 'kg' ? 'kg' : unit === 'ladrillos' ? 'ladrillos' : ''; }
  function fmtReps(set) { if (set.reps == null) return '?'; return set.mode === 'time' ? set.reps + '″' : String(set.reps); }
  function fmtSet(set) { const l = fmtLoad(set.load, set.unit); const r = fmtReps(set); return l ? l + ' × ' + r : r; }
  function fmtSecs(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad2(s % 60); }
  function fmtDuration(ms) { const m = Math.max(0, Math.round(ms / 60000)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; }
  function rangeLabel(ex) { return ex.mode === 'time' ? ex.min + '-' + ex.max + '″' : ex.min + '-' + ex.max + ' reps'; }

  /* ---- Cola de series de una rutina ----
     Circuito: vuelta 1 (ej 1, ej 2, …), vuelta 2, …  Series: ej 1 (serie 1..n), ej 2, … */
  function buildQueue(routine, roundsOverride) {
    const steps = [];
    (routine.blocks || []).forEach((block, bi) => {
      const rounds = (roundsOverride && roundsOverride[bi]) || block.rounds || 1;
      const exs = block.exercises || [];
      if (block.type === 'circuit') {
        for (let r = 1; r <= rounds; r++) {
          exs.forEach((ex, ei) => {
            const last = ei === exs.length - 1;
            steps.push({ block: bi, blockName: block.name, ex: ei, key: slug(ex.name), round: r, roundsTotal: rounds,
              setNo: r, setsTotal: rounds, restAfter: last ? (block.restAfterRound || 0) : (block.restBetween || 0), endsRound: last });
          });
        }
      } else {
        exs.forEach((ex, ei) => {
          const sets = ex.sets || 1;
          for (let s = 1; s <= sets; s++) {
            steps.push({ block: bi, blockName: block.name, ex: ei, key: slug(ex.name), round: 1, roundsTotal: 1,
              setNo: s, setsTotal: sets, restAfter: ex.rest || 0, endsRound: s === sets });
          }
        });
      }
    });
    steps.forEach((s, i) => { s.index = i; });
    if (steps.length) steps[steps.length - 1].restAfter = 0;
    return steps;
  }
  function routineSummary(routine) {
    const q = buildQueue(routine);
    const names = [];
    (routine.blocks || []).forEach(b => (b.exercises || []).forEach(e => { if (!names.includes(e.name)) names.push(e.name); }));
    return { sets: q.length, exercises: names.length, names };
  }

  /* ---- Historial de un ejercicio: más reciente primero ---- */
  function sortSessions(sessions) {
    return sessions.slice().sort((a, b) => ((b.date || '') + (b.startedAt || '')).localeCompare((a.date || '') + (a.startedAt || '')));
  }
  function exerciseHistory(sessions, key, opts) {
    opts = opts || {};
    const out = [];
    for (const s of sortSessions(sessions)) {
      if (opts.exclude && s.id === opts.exclude) continue;
      const sets = (s.sets || []).filter(x => x.key === key);
      if (sets.length) out.push({ sessionId: s.id, date: s.date, routineName: s.routineName, sets });
      if (opts.limit && out.length >= opts.limit) break;
    }
    return out;
  }

  /* ---- Doble progresión: dos sesiones seguidas al tope del rango con RIR ≤ 2 → subir ---- */
  function progressionHint(ex, history) {
    if (!history || !history.length) return null;
    const top = h => h.sets.length > 0 && h.sets.every(s => s.reps != null && s.reps >= ex.max && s.rir != null && s.rir <= 2);
    if (history.length >= 2 && top(history[0]) && top(history[1])) {
      const step = ex.mode === 'time' ? '+5″' : ex.unit === 'ladrillos' ? '+1 ladrillo' : ex.unit === 'kg' ? 'siguiente peso' : 'más difícil';
      return { type: 'up', text: 'Subí la carga (' + step + '): dos sesiones seguidas al tope del rango con RIR ≤ 2. Volvé al piso del rango.' };
    }
    if (history[0].sets.some(s => s.rir === 0 && s.reps != null && s.reps < ex.min)) {
      return { type: 'down', text: 'La última vez llegaste al fallo por debajo del rango: bajá un poco la carga.' };
    }
    if (top(history[0])) {
      return { type: 'near', text: 'Una sesión más al tope del rango con RIR ≤ 2 y toca subir la carga.' };
    }
    return null;
  }

  /* ---- Sugerir próxima rutina: entre las activas, la que hace más tiempo no se hace ---- */
  function suggestNext(routines, sessions) {
    const active = routines.filter(r => r.active);
    const pool = active.length ? active : routines;
    if (!pool.length) return null;
    const last = {};
    sessions.forEach(s => { if (s.routineId && (!last[s.routineId] || s.date > last[s.routineId])) last[s.routineId] = s.date; });
    let best = null;
    pool.forEach(r => { const d = last[r.id] || ''; if (!best || d < best.d) best = { r, d }; });
    return best.r;
  }
  function lastSessionOf(routineId, sessions) {
    let best = null;
    sessions.forEach(s => { if (s.routineId === routineId && (!best || s.date > best.date)) best = s; });
    return best;
  }

  /* ---- Estadísticas de cadencia ---- */
  function stats(sessions, todayStr) {
    const today = parseDate(todayStr);
    const days = Array.from(new Set(sessions.map(s => s.date))).map(parseDate);
    const wk0 = startOfWeek(today);
    const inWeek = start => days.filter(d => d >= start && d < addDays(start, 7)).length;
    const thisWeek = inWeek(wk0);
    const last4 = days.filter(d => d >= addDays(wk0, -21) && d < addDays(wk0, 7)).length;
    let streak = 0, w = wk0;
    if (!inWeek(w)) w = addDays(w, -7);
    while (inWeek(w)) { streak++; w = addDays(w, -7); }
    const weeks = [];
    for (let i = 11; i >= 0; i--) { const start = addDays(wk0, -7 * i); weeks.push({ start: dateStr(start), count: inWeek(start) }); }
    return { thisWeek, last4, total: days.length, streak, weeks };
  }

  const api = { FEELS, feel, slug, uid, clone, dateStr, parseDate, addDays, startOfWeek, daysBetween, DAYS, DAYS_SHORT, MONTHS,
    fmtDateLong, fmtDateShort, relDate, fmtTime, fmtNum, fmtLoad, unitLabel, fmtReps, fmtSet, fmtSecs, fmtDuration, rangeLabel,
    buildQueue, routineSummary, sortSessions, exerciseHistory, progressionHint, suggestNext, lastSessionOf, stats };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  return api;
})();
