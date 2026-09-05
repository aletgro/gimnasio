/* Datos iniciales: tus rutinas y las dos sesiones que ya hiciste.
   Se cargan solo la primera vez (o desde Datos → "Restaurar rutinas de ejemplo"). */
window.GYM_SEED = (function () {
  const kg = (name, min, max, target, extra) => Object.assign({
    name, note: '', mode: 'reps', min, max, unit: 'kg', step: 2.5, perSide: false, target, sets: 3, rest: 90
  }, extra || {});
  const time = (name, min, max, extra) => Object.assign({
    name, note: '', mode: 'time', min, max, unit: 'none', step: 0, perSide: false, target: 0, sets: 3, rest: 45
  }, extra || {});

  const routines = [
    {
      id: 'fase1',
      name: 'Fase 1 · Full body',
      subtitle: 'Reenganche · circuito · ~30′',
      active: true,
      warmup: 'Cinta 3′ progresiva (5 → 6,5 km/h) · 10 sentadillas sin peso · círculos de brazos. ~4′.',
      notes: 'RIR 3-4 en todo. Si dudás entre dos pesos, el menor. 2 vueltas la primera sesión, 3 en adelante. Descansos 45-60″ entre ejercicios, 90″ al cerrar cada vuelta.',
      blocks: [
        {
          id: 'b1', type: 'circuit', name: 'Circuito', rounds: 3, restBetween: 50, restAfterRound: 90,
          exercises: [
            kg('Sentadilla', 8, 12, 15, { note: 'barra' }),
            kg('Banco plano con mancuernas', 10, 15, 7.5, { note: 'c/mano', step: 1 }),
            kg('Peso muerto rumano', 8, 12, 15, { note: 'barra' }),
            kg('Remo a 1 mano', 8, 12, 10, { perSide: true, step: 1 }),
            kg('Elevaciones laterales', 12, 15, 4, { note: 'c/mano', step: 1 }),
            time('Plancha', 20, 45)
          ]
        }
      ]
    },
    {
      id: 'fase2-d1',
      name: 'Fase 2 · Día 1 · Piernas + core',
      subtitle: 'Series · ~27′',
      active: false,
      warmup: 'Cinta 5′: 0-2′ suave (5-5,5 km/h) · 2-4′ rápida (6-7 km/h, +2-4 %) · 4-5′ mantener · 10 sentadillas sin peso.',
      notes: 'Semanas 3-4: RIR 2-3. Semana 5 en adelante: RIR 1-2. Si venís justo de tiempo recortá plancha, nunca sentadilla.',
      blocks: [
        {
          id: 'b1', type: 'straight', name: 'Series', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            kg('Sentadilla', 8, 12, 10, { sets: 3, rest: 90 }),
            kg('Peso muerto rumano', 8, 12, 10, { note: 'mancuernas, c/mano', sets: 3, rest: 90 }),
            kg('Estocadas', 8, 12, 0, { note: 'por pierna · sin peso, luego mancuernas', perSide: true, sets: 2, rest: 70, step: 1 }),
            time('Plancha', 20, 45, { sets: 3, rest: 45 })
          ]
        }
      ]
    },
    {
      id: 'fase2-d2',
      name: 'Fase 2 · Día 2 · Torso',
      subtitle: 'Supersets · ~29′',
      active: false,
      warmup: 'Cinta 5′ igual al Día 1; el último minuto: círculos de brazos y rotaciones de hombro.',
      notes: 'En cada ronda del superset B: remo derecha → remo izquierda → press → descanso.',
      blocks: [
        {
          id: 'b1', type: 'circuit', name: 'Superset A', rounds: 3, restBetween: 0, restAfterRound: 70,
          exercises: [
            kg('Jalón dorsal', 8, 12, 4, { unit: 'ladrillos', step: 1 }),
            kg('Banco plano con mancuernas', 10, 15, 6, { note: 'c/mano', step: 1 })
          ]
        },
        {
          id: 'b2', type: 'circuit', name: 'Superset B', rounds: 3, restBetween: 0, restAfterRound: 75,
          exercises: [
            kg('Remo a 1 mano', 8, 12, 10, { perSide: true, step: 1 }),
            kg('Press militar con mancuernas', 8, 12, 5, { note: 'c/mano · parado o sentado', step: 1 })
          ]
        },
        {
          id: 'b3', type: 'straight', name: 'Cierre', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            kg('Elevaciones laterales', 12, 15, 4, { note: 'c/mano', sets: 2, rest: 50, step: 1 }),
            kg('Curl de bíceps', 10, 15, 4, { note: 'opcional si sobra tiempo', sets: 2, rest: 45, step: 1 })
          ]
        }
      ]
    },
    {
      id: 'alt-a',
      name: 'Alternativa · Full body A',
      subtitle: 'Sentadilla + empuje/tracción · ~28′',
      active: false,
      warmup: 'Cinta 5′ progresiva + 10 sentadillas sin peso + 1 serie liviana del primer ejercicio.',
      notes: 'Propuesta para fuerza y salud: 3 veces por semana alternando A-B-A / B-A-B. Sentadilla y peso muerto en 6-10 reps con descanso largo; el resto en 8-12.',
      blocks: [
        {
          id: 'b1', type: 'straight', name: 'Principal', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            kg('Sentadilla', 6, 10, 15, { note: 'barra o goblet', sets: 3, rest: 105 })
          ]
        },
        {
          id: 'b2', type: 'circuit', name: 'Superset', rounds: 3, restBetween: 0, restAfterRound: 75,
          exercises: [
            kg('Banco plano con mancuernas', 8, 12, 7.5, { note: 'c/mano', step: 1 }),
            kg('Jalón dorsal', 8, 12, 4, { unit: 'ladrillos', step: 1 })
          ]
        },
        {
          id: 'b3', type: 'straight', name: 'Core', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            time('Plancha lateral', 20, 40, { note: 'por lado', perSide: true, sets: 2, rest: 30 })
          ]
        }
      ]
    },
    {
      id: 'alt-b',
      name: 'Alternativa · Full body B',
      subtitle: 'Bisagra + press/remo + carry · ~28′',
      active: false,
      warmup: 'Cinta 5′ progresiva + 10 buenos días sin peso + círculos de brazos.',
      notes: 'Farmer carry: caminá 30-40″ con una mancuerna pesada en cada mano, tronco firme. Si no hay lugar, marchá en el lugar.',
      blocks: [
        {
          id: 'b1', type: 'straight', name: 'Principal', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            kg('Peso muerto rumano', 6, 10, 15, { note: 'barra o mancuernas', sets: 3, rest: 105 })
          ]
        },
        {
          id: 'b2', type: 'circuit', name: 'Superset', rounds: 3, restBetween: 0, restAfterRound: 75,
          exercises: [
            kg('Press militar con mancuernas', 8, 12, 5, { note: 'c/mano', step: 1 }),
            kg('Remo a 1 mano', 8, 12, 10, { perSide: true, step: 1 })
          ]
        },
        {
          id: 'b3', type: 'straight', name: 'Carry', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            time('Farmer carry', 30, 40, { note: 'mancuerna en cada mano', unit: 'kg', target: 12.5, step: 2.5, sets: 3, rest: 60 })
          ]
        }
      ]
    },
    {
      id: 'fase3-upper-a',
      name: 'Fase 3 · Upper A',
      subtitle: '4 días/sem · torso, énfasis horizontal · ~27′',
      active: false,
      warmup: 'Cinta 5′ progresiva + círculos de brazos y rotaciones de hombro + 1 serie liviana del primer superset.',
      notes: 'Semana: Upper A · Lower A · (descanso) · Upper B · Lower B. Mínimo 48 h entre los dos días de torso. RIR objetivo 2; el cierre se recorta primero si falta tiempo. Descarga (mitad de series) cada 6-8 semanas.',
      blocks: [
        { id: 'b1', type: 'circuit', name: 'Superset A', rounds: 3, restBetween: 0, restAfterRound: 90,
          exercises: [ kg('Banco plano con mancuernas', 6, 10, 10, { note: 'c/mano', step: 1 }), kg('Remo a 1 mano', 6, 10, 15, { perSide: true, step: 1 }) ] },
        { id: 'b2', type: 'circuit', name: 'Superset B', rounds: 3, restBetween: 0, restAfterRound: 75,
          exercises: [ kg('Press militar con mancuernas', 8, 12, 7.5, { note: 'c/mano', step: 1 }), kg('Jalón dorsal', 8, 12, 5, { unit: 'ladrillos', step: 1 }) ] },
        { id: 'b3', type: 'circuit', name: 'Cierre', rounds: 2, restBetween: 0, restAfterRound: 45,
          exercises: [ kg('Face pull', 12, 15, 0, { note: 'polea; si no hay, elevaciones posteriores', step: 1 }), kg('Curl de bíceps', 10, 15, 5, { note: 'c/mano', step: 1 }) ] }
      ]
    },
    {
      id: 'fase3-lower-a',
      name: 'Fase 3 · Lower A',
      subtitle: '4 días/sem · piernas, énfasis sentadilla · ~29′',
      active: false,
      warmup: 'Cinta 5′ progresiva + 10 sentadillas sin peso + 1-2 series de aproximación de sentadilla (50 % y 75 % del peso de trabajo).',
      notes: 'Sentadilla pesada primero (5-8 reps, RIR 2, nunca menos de 1). Peso muerto rumano moderado. Mínimo 48 h antes de Lower B.',
      blocks: [
        { id: 'b1', type: 'straight', name: 'Principal', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [ kg('Sentadilla', 5, 8, 25, { note: 'barra o goblet', sets: 4, rest: 120 }), kg('Peso muerto rumano', 8, 12, 25, { note: 'barra o mancuernas', sets: 3, rest: 90 }) ] },
        { id: 'b2', type: 'circuit', name: 'Superset', rounds: 2, restBetween: 0, restAfterRound: 60,
          exercises: [ kg('Estocada hacia atrás', 8, 12, 0, { note: 'por pierna; mancuernas cuando sea fácil', perSide: true, step: 1 }), time('Plancha lateral', 20, 40, { note: 'por lado', perSide: true }) ] }
      ]
    },
    {
      id: 'fase3-upper-b',
      name: 'Fase 3 · Upper B',
      subtitle: '4 días/sem · torso, énfasis vertical · ~27′',
      active: false,
      warmup: 'Cinta 5′ progresiva + círculos de brazos y rotaciones de hombro + 1 serie liviana del primer superset.',
      notes: 'Jalón y press militar pesados (6-10). Banco inclinado o flexiones y remo con apoyo moderados. El cierre se recorta primero.',
      blocks: [
        { id: 'b1', type: 'circuit', name: 'Superset A', rounds: 3, restBetween: 0, restAfterRound: 90,
          exercises: [ kg('Jalón dorsal', 6, 10, 6, { unit: 'ladrillos', step: 1 }), kg('Press militar con mancuernas', 6, 10, 7.5, { note: 'c/mano', step: 1 }) ] },
        { id: 'b2', type: 'circuit', name: 'Superset B', rounds: 3, restBetween: 0, restAfterRound: 75,
          exercises: [ kg('Banco inclinado con mancuernas', 8, 12, 7.5, { note: 'c/mano; o flexiones de brazos', step: 1 }), kg('Remo con apoyo en banco', 8, 12, 10, { note: 'pecho apoyado, o remo sentado en polea', step: 1 }) ] },
        { id: 'b3', type: 'circuit', name: 'Cierre', rounds: 2, restBetween: 0, restAfterRound: 45,
          exercises: [ kg('Elevaciones laterales', 12, 15, 5, { note: 'c/mano', step: 1 }), kg('Extensión de tríceps en polea', 12, 15, 0, { note: 'o face pull', step: 1 }) ] }
      ]
    },
    {
      id: 'fase3-lower-b',
      name: 'Fase 3 · Lower B',
      subtitle: '4 días/sem · piernas, énfasis bisagra · ~29′',
      active: false,
      warmup: 'Cinta 5′ progresiva + 10 buenos días sin peso + 1-2 series de aproximación de peso muerto.',
      notes: 'Peso muerto rumano pesado primero (5-8 reps, RIR 2, nunca menos de 1). Sentadilla goblet o búlgara moderada. Puente de glúteo + farmer carry para cerrar.',
      blocks: [
        { id: 'b1', type: 'straight', name: 'Principal', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [ kg('Peso muerto rumano', 5, 8, 30, { note: 'barra o mancuernas', sets: 4, rest: 120 }), kg('Sentadilla goblet', 8, 12, 15, { note: 'o sentadilla búlgara por pierna', sets: 3, rest: 90 }) ] },
        { id: 'b2', type: 'circuit', name: 'Superset', rounds: 2, restBetween: 0, restAfterRound: 60,
          exercises: [ kg('Puente de glúteo', 10, 15, 10, { note: 'mancuerna sobre la cadera', step: 2.5 }), time('Farmer carry', 30, 40, { note: 'mancuerna en cada mano', unit: 'kg', target: 15, step: 2.5 }) ] }
      ]
    }
  ];

  // Tus dos primeras sesiones (lunes 31/8 y viernes 4/9): solo pesos, sin reps ni sensación.
  const circuit = routines[0].blocks[0].exercises;
  function importedSession(id, date, rounds, loads, startHour) {
    const sets = [];
    let n = 0;
    for (let r = 1; r <= rounds; r++) {
      circuit.forEach((ex, i) => {
        sets.push({
          id: id + '-' + (++n), key: window.GymLogic.slug(ex.name), name: ex.name, mode: ex.mode, unit: ex.unit,
          perSide: ex.perSide, block: 0, round: r, setNo: r, setsTotal: rounds, stepIndex: n - 1,
          load: ex.unit === 'none' ? null : loads[i], reps: null, rir: null,
          t: date + 'T' + startHour + ':' + String(10 + n * 3).padStart(2, '0') + ':00'
        });
      });
    }
    return {
      id, date, routineId: 'fase1', routineName: 'Fase 1 · Full body', manual: false,
      startedAt: date + 'T' + startHour + ':00:00', endedAt: date + 'T' + startHour + ':' + (rounds === 2 ? '22' : '30') + ':00',
      sets, note: 'Cargada desde tus notas: pesos sin reps ni sensación. Podés editarla o borrarla.'
    };
  }
  const sessions = [
    importedSession('s-2026-08-31', '2026-08-31', 2, [12.5, 6, 12.5, 10, 3, null], '19'),
    importedSession('s-2026-09-04', '2026-09-04', 3, [15, 7.5, 15, 10, 4, null], '19')
  ];

  return { routines, sessions };
});
