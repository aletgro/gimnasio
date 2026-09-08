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
  function fmtSet(set) { const l = fmtLoad(set.load, set.unit); if (set.reps == null) return l || '?'; return l ? l + ' × ' + fmtReps(set) : fmtReps(set); }
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
    return steps;
  }
  /* ---- Posponer: el ejercicio de la posición idx pasa a hacerse después del que le sigue.
     Se mueve el tramo de series seguidas del ejercicio actual (desde idx) detrás del tramo del ejercicio siguiente:
     en un circuito es una serie de cada uno; en series seguidas, todas las que quedan de ese ejercicio.
     Devuelve { queue, map (posición vieja → nueva), moved, ahead, movedCount, aheadCount } o null si no hay otro ejercicio después. */
  function postponeStep(queue, idx) {
    if (!queue || idx < 0 || idx >= queue.length) return null;
    const same = (a, b) => a.block === b.block && a.ex === b.ex;
    let b = idx; while (b < queue.length && same(queue[b], queue[idx])) b++;
    if (b >= queue.length) return null;
    let c = b; while (c < queue.length && same(queue[c], queue[b])) c++;
    const order = [];
    for (let i = 0; i < idx; i++) order.push(i);
    for (let i = b; i < c; i++) order.push(i);
    for (let i = idx; i < b; i++) order.push(i);
    for (let i = c; i < queue.length; i++) order.push(i);
    const map = {};
    order.forEach((old, i) => { map[old] = i; });
    const next = order.map((old, i) => Object.assign({}, queue[old], { index: i }));
    return { queue: next, map, moved: queue[idx], ahead: queue[b], movedCount: b - idx, aheadCount: c - b };
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

  /* ---- Guía de doble progresión con RIR objetivo ----
     target = { min, max } es el RIR objetivo de la fase: terminar cada serie pudiendo hacer entre min y max reps más.
     RIR por debajo de min = más al límite de lo previsto ("hard"); por encima de max = te sobró ("easy"). */
  function effort(rir, target) {
    if (rir == null || !target) return null;
    if (rir < target.min) return 'hard';
    if (rir > target.max) return 'easy';
    return 'ok';
  }
  function rirLabel(target) { return 'RIR ' + (target.min === target.max ? target.min : target.min + '-' + target.max); }
  function loadStepOf(ex) { return ex.step || (ex.unit === 'ladrillos' ? 1 : 2.5); }
  function unitWord(ex, n) { return ex.mode === 'time' ? (n === 1 ? 'segundo' : 'segundos') : (n === 1 ? 'rep' : 'reps'); }
  function stepText(ex, dir) {
    const sign = dir < 0 ? '−' : '+';
    if (ex.mode === 'time') return sign + '5″';
    if (ex.unit === 'ladrillos') return sign + '1 ladrillo';
    if (ex.unit === 'kg') return sign + fmtNum(loadStepOf(ex)) + ' kg';
    return dir < 0 ? 'más fácil' : 'más difícil';
  }
  function nextLoad(ex, load, dir) {
    if (ex.unit === 'none' || load == null) return null;
    return Math.max(0, Math.round((load + dir * loadStepOf(ex)) * 100) / 100);
  }
  /* Serie de referencia de una sesión anterior: la misma serie (n, desde 0) o la última si hubo menos. */
  function refSet(h, n) { return h && h.sets && h.sets.length ? (h.sets[n] || h.sets[h.sets.length - 1]) : null; }
  /* Decisión para el ejercicio hoy, a partir de su historial (más reciente primero). Devuelve
     { kind, load, reps, targets?, short, text }. kinds: first | start | down | up | near | hold | hard | reps.
     Regla del programa: la carga sube cuando dos sesiones seguidas llegan al tope del rango en todas las series
     sin pasarse del RIR objetivo; si además sobró (RIR por encima del máximo), alcanza con una. */
  function exercisePlan(ex, target, history) {
    const h0 = history && history[0], h1 = history && history[1];
    const u = unitWord(ex), lbl = rirLabel(target), isTime = ex.mode === 'time', hasLoad = ex.unit !== 'none';
    const rng = target.min + '-' + target.max;
    if (!h0) return { kind: 'first', load: hasLoad && ex.target != null ? ex.target : null, reps: ex.min,
      short: (hasLoad ? 'elegí la carga: ' : '') + ex.min + ' ' + u + ' con ' + lbl,
      text: 'Primera vez. ' + (hasLoad ? 'Elegí una carga con la que hagas ' + ex.min + ' ' + u + ' con técnica limpia, terminando con ' + lbl + '. Si dudás entre dos, la menor.' : 'Llegá a ' + ex.min + ' ' + u + ' con buena forma, terminando con ' + lbl + '.') };
    const sets = h0.sets, last = sets[sets.length - 1], lastLoad = hasLoad ? last.load : null;
    const loadTxt = hasLoad && lastLoad != null ? ' (' + fmtLoad(lastLoad, ex.unit) + ')' : '';
    const top = s => s.reps != null && s.reps >= ex.max;
    const rated = sets.filter(s => s.rir != null);
    const worst = rated.length ? Math.min.apply(null, rated.map(s => s.rir)) : null;
    const best = rated.length ? Math.max.apply(null, rated.map(s => s.rir)) : null;
    const anyHard = worst != null && worst < target.min;
    const anyEasy = best != null && best > target.max;
    const allEasy = rated.length > 0 && rated.every(s => s.rir > target.max);
    if (sets.every(s => s.reps == null)) return { kind: 'start', load: lastLoad, reps: ex.min,
      short: 'mismo peso, ' + ex.min + ' ' + u + ' con ' + lbl,
      text: 'La última vez no anotaste ' + u + '. Mismo peso' + loadTxt + ': arrancá en ' + ex.min + ' terminando con ' + lbl + ', y de ahí sumás.' };
    if (sets.some(s => s.rir === 0 && s.reps != null && s.reps < ex.min)) {
      const load = nextLoad(ex, lastLoad, -1);
      return { kind: 'down', load, reps: ex.min, short: hasLoad && load != null ? 'bajá a ' + fmtLoad(load, ex.unit) : 'hacela más fácil',
        text: 'La última vez llegaste al fallo por debajo de ' + ex.min + ' ' + u + '. ' + (hasLoad ? 'Bajá la carga (' + stepText(ex, -1) + ')' : 'Hacela más fácil') + ' y volvé a construir desde ' + ex.min + ' con ' + lbl + '.' };
    }
    const topAll = sets.every(top);
    const prevOk = !!(h1 && h1.sets.every(top) && (!hasLoad || refSet(h1, 99).load === lastLoad) && !h1.sets.some(s => s.rir != null && s.rir < target.min));
    if (topAll && !anyHard && (allEasy || prevOk)) {
      const why = allEasy ? 'llegaste a ' + ex.max + ' en todas las series y te sobró (RIR ' + (worst === best ? worst : worst + '-' + best) + ')' : 'dos sesiones seguidas al tope en todas las series dentro del ' + lbl;
      if (!hasLoad) return { kind: 'up', load: null, reps: isTime ? ex.max + 5 : ex.max,
        short: isTime ? 'subí el objetivo a ' + (ex.max + 5) + '″' : 'hacela más difícil',
        text: 'Toca subir: ' + why + '. ' + (isTime ? 'Buscá ' + (ex.max + 5) + '″ o hacela más difícil (más lento, pies elevados).' : 'Hacela más difícil (más lento, más recorrido).') };
      const load = nextLoad(ex, lastLoad, 1);
      return { kind: 'up', load, reps: ex.min, short: 'subí a ' + fmtLoad(load, ex.unit) + ' y volvé a ' + ex.min,
        text: 'Subí la carga (' + stepText(ex, 1) + '): ' + why + '. Volvé a ' + ex.min + ' ' + u + ' con el peso nuevo; la técnica no cambia.' };
    }
    if (topAll && !anyHard) return { kind: 'near', load: lastLoad, reps: ex.max, short: 'repetí ' + ex.max + ' en todas y la próxima subís',
      text: 'Ya tocaste el tope (' + ex.max + ') en todas las series. Repetilo hoy terminando con ' + lbl + ' y en la próxima sesión subís la carga.' };
    if (topAll) return { kind: 'hold', load: lastLoad, reps: ex.max, short: 'mismo peso, ' + ex.max + ' con ' + lbl,
      text: 'Llegaste a ' + ex.max + ' pero más al límite de lo que pide la fase (RIR ' + worst + ', objetivo ' + rng + '). Mismo peso' + loadTxt + ': el día que hagas ' + ex.max + ' en todas las series terminando con ' + lbl + ', subís.' };
    if (anyHard) return { kind: 'hard', load: lastLoad, reps: null, short: 'mismo peso, cortá en ' + lbl,
      text: 'La última vez fuiste más al límite de lo que pide la fase (RIR ' + worst + ', objetivo ' + rng + '). Mismo peso' + loadTxt + ', pero cortá cada serie al llegar a ' + lbl + '; las ' + u + ' extra llegan cuando el peso se sienta más fácil.' };
    const inc = anyEasy ? 2 : 1;
    const targets = sets.map(s => Math.min(ex.max, (s.reps == null ? ex.min : s.reps) + inc));
    return { kind: 'reps', load: lastLoad, reps: targets[0], targets, short: 'mismo peso, ' + targets.join(' · '),
      text: (anyEasy ? 'Te sobró (RIR ' + best + '): m' : 'M') + 'ismo peso' + loadTxt + ', ' + (inc === 2 ? 'dos ' : 'una ') + unitWord(ex, inc) + ' más por serie: ' + targets.join(' · ') + '. Misma técnica, mismo recorrido.' };
  }
  function setTarget(plan, n) { return plan.targets ? plan.targets[Math.min(n, plan.targets.length - 1)] : plan.reps; }
  /* Evaluación de una serie recién guardada: progreso contra la serie de referencia y exigencia contra el RIR objetivo.
     kind: good | ok | warn | bad | muted */
  function evaluateSet(ex, target, set, ref, planReps) {
    const parts = []; let kind = 'ok';
    const u = unitWord(ex), rng = target.min + '-' + target.max;
    if (ref && ex.unit !== 'none' && set.load != null && ref.load != null && set.load !== ref.load) {
      const d = set.load - ref.load;
      parts.push('carga ' + (d > 0 ? '+' : '−') + fmtNum(Math.abs(d)) + (ex.unit === 'kg' ? ' kg' : '') + ' vs. la última vez'); if (d > 0) kind = 'good';
    } else if (ref && ref.reps != null && set.reps != null) {
      const d = set.reps - ref.reps;
      if (d > 0) { parts.push('+' + d + ' ' + unitWord(ex, d) + ' que la última vez'); kind = 'good'; }
      else if (d === 0) parts.push('igual que la última vez');
      else parts.push(d + ' ' + unitWord(ex, -d) + ' que la última vez');
    } else if (planReps != null && set.reps != null) {
      if (set.reps >= planReps) { parts.push('objetivo cumplido'); kind = 'good'; } else parts.push('por debajo del objetivo (' + planReps + ')');
    }
    const eff = effort(set.rir, target);
    if (eff === null) { parts.push('sin sensación: anotala para evaluar la exigencia'); if (kind === 'ok') kind = 'muted'; }
    else if (eff === 'hard') {
      kind = set.rir === 0 ? 'bad' : 'warn';
      parts.push('RIR ' + set.rir + ': más al límite de lo que pide la fase (' + rng + ')' +
        (set.reps != null && set.reps < ex.min ? '. Bajá un poco la carga' : set.reps != null && set.reps >= ex.max ? '. No subas la carga todavía' : '. Cortá antes la próxima'));
    } else if (eff === 'easy') {
      kind = 'warn';
      parts.push('RIR ' + set.rir + ': te sobró (objetivo ' + rng + ')' + (set.reps != null && set.reps >= ex.max ? '. Subí la carga ya en la próxima serie' : '. Sumá ' + u + ' en la próxima'));
    } else parts.push('RIR ' + set.rir + ', dentro del objetivo');
    return { kind, text: parts.join(' · ') };
  }
  /* Veredicto de un ejercicio al cerrar la sesión: comparación con la última vez, exigencia y decisión para la próxima. */
  function exerciseVerdict(ex, target, todaySets, history) {
    const h0 = history && history[0], u = unitWord(ex), parts = [];
    const sum = arr => arr.reduce((a, s) => a + (s.reps || 0), 0);
    const loadNow = todaySets[todaySets.length - 1].load;
    if (h0) {
      const lastLoad = refSet(h0, 99).load;
      if (ex.unit !== 'none' && loadNow != null && lastLoad != null && loadNow !== lastLoad) parts.push('carga ' + (loadNow > lastLoad ? '+' : '−') + fmtNum(Math.abs(loadNow - lastLoad)) + (ex.unit === 'kg' ? ' kg' : ''));
      else if (h0.sets.some(s => s.reps != null)) { const d = sum(todaySets) - sum(h0.sets); parts.push(d > 0 ? '+' + d + ' ' + unitWord(ex, d) + ' en total' : d === 0 ? 'mismas ' + u + ' que la última vez' : d + ' ' + u + ' en total'); }
      else parts.push('primera vez con ' + u + ' anotadas');
    } else parts.push('primera vez');
    const rated = todaySets.filter(s => s.rir != null);
    if (rated.length) {
      const effs = rated.map(s => effort(s.rir, target));
      parts.push('RIR ' + rated.map(s => s.rir).join('·') + (effs.includes('hard') ? ', más exigente que la fase' : effs.every(e => e === 'easy') ? ', te sobró' : ', en objetivo'));
    } else parts.push('sin sensación anotada');
    const next = exercisePlan(ex, target, [{ sets: todaySets }].concat(history || []));
    return { text: parts.join(' · '), next };
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
    buildQueue, postponeStep, routineSummary, sortSessions, exerciseHistory, effort, rirLabel, refSet, exercisePlan, setTarget, evaluateSet, exerciseVerdict, suggestNext, lastSessionOf, stats };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  return api;
})();
