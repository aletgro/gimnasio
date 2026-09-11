/* Datos iniciales: tus rutinas y las dos sesiones que ya hiciste.
   Se cargan solo la primera vez (o desde Datos → "Restaurar rutinas de ejemplo"). */
window.GYM_SEED = (function () {
  const kg = (name, min, max, target, extra) => Object.assign({
    name, note: '', why: '', mode: 'reps', min, max, unit: 'kg', step: 2.5, perSide: false, target, sets: 3, rest: 90, rirMin: null
  }, extra || {});
  const time = (name, min, max, extra) => Object.assign({
    name, note: '', why: '', mode: 'time', min, max, unit: 'none', step: 0, perSide: false, target: 0, sets: 3, rest: 45, rirMin: null
  }, extra || {});

  /* Por qué cada rango (se muestra en la sesión). Criterio: buen estímulo con carga articular contenida.
     Detalle y referencias en docs/rangos-de-repeticiones.pdf. */
  const W = {
    legHeavy: 'Compuesto principal: 6-10 da fuerza e hipertrofia con ~70-80 % del máximo, sin el pico sobre columna y rodillas de las series de 1-5. RIR 2 mínimo.',
    legMod: 'Compuesto de pierna en día moderado: 8-12 mantiene el estímulo con menos carga absoluta sobre columna y rodillas.',
    legRe: 'Reenganche: 8-12 con carga moderada mientras tendones y articulaciones se readaptan (tardan más que el músculo).',
    hingeHeavy: 'Bisagra principal: 6-10 con RIR 2 mínimo; por debajo de 6 la carga y el cizallamiento lumbar suben mucho más que el estímulo.',
    hingeMod: 'Bisagra en día moderado: 8-12 mantiene la carga lumbar contenida; los isquios responden muy bien a este rango.',
    hingeRe: 'Reenganche de la bisagra: 8-12 con carga moderada; lumbares e isquios se readaptan antes de cargar más.',
    unilateral: '8-12 por pierna: la carga es baja y la rodilla trabaja estable; se progresa por reps antes que por kilos.',
    pressRe: 'Empuje en reenganche: 10-15 con carga liviana para readaptar hombro y codo sin peso alto.',
    press: 'Empuje: 8-12 evita cargas máximas con el hombro en su posición más vulnerable; el estímulo para pecho es el mismo.',
    ohp: 'Press vertical: nunca por debajo de 8. El hombro por encima de la cabeza es la articulación de más riesgo del gimnasio.',
    pullHeavy: 'Tracción principal: el hombro trabaja retraído y estable, por eso tolera 6-10 con carga alta sin riesgo.',
    pull: 'Tracción: 8-12 cuida codo (epicondilitis) y tendón del bíceps, con estímulo completo para dorsal y espalda.',
    shoulderIso: 'Aislamiento de hombro: músculo chico y tendón del supraespinoso; 12-15 con poco peso y control es lo que rinde.',
    facepull: 'Face pull: manguito rotador y trapecio medio con carga liviana; 12-15 es salud de hombro, no fuerza.',
    arms: 'Brazos: carga liviana y muchas reps protegen los tendones del codo; con más peso se pierde la técnica, no se gana estímulo.',
    glute: 'Puente de glúteo: la cadera tolera muy bien la carga; 10-15 con pausa arriba es seguro y suficiente.',
    core: 'Isométrico: se progresa por segundos, no por carga; la columna se mantiene neutra sin compresión extra.',
    carry: 'Tiempo bajo carga con tronco firme; se suben kilos solo si los 40″ salen con postura perfecta.'
  };

  const routines = [
    {
      id: 'fase1',
      name: 'Fase 1 · Full body',
      subtitle: 'Reenganche · circuito · ~30′',
      active: true,
      rirMin: 3, rirMax: 4,
      warmup: 'Cinta 3′ progresiva (5 → 6,5 km/h) · 10 sentadillas sin peso · círculos de brazos. ~4′.',
      notes: 'RIR 3-4 en todo. Si dudás entre dos pesos, el menor. 2 vueltas la primera sesión, 3 en adelante. Descansos 45-60″ entre ejercicios, 90″ al cerrar cada vuelta.',
      blocks: [
        {
          id: 'b1', type: 'circuit', name: 'Circuito', rounds: 3, restBetween: 50, restAfterRound: 90,
          exercises: [
            kg('Sentadilla', 8, 12, 15, { note: 'barra', why: W.legRe }),
            kg('Banco plano con mancuernas', 10, 15, 7.5, { note: 'c/mano', step: 1, why: W.pressRe }),
            kg('Peso muerto rumano', 8, 12, 15, { note: 'barra', why: W.hingeRe }),
            kg('Remo a 1 mano', 8, 12, 10, { perSide: true, step: 1, why: W.pull }),
            kg('Elevaciones laterales', 12, 15, 4, { note: 'c/mano', step: 1, why: W.shoulderIso }),
            time('Plancha', 20, 45, { why: W.core })
          ]
        }
      ]
    },
    {
      id: 'fase2-d1',
      name: 'Fase 2 · Día 1 · Piernas + core',
      subtitle: 'Series · ~27′',
      active: false,
      rirMin: 2, rirMax: 3,
      warmup: 'Cinta 5′: 0-2′ suave (5-5,5 km/h) · 2-4′ rápida (6-7 km/h, +2-4 %) · 4-5′ mantener · 10 sentadillas sin peso.',
      notes: 'Semanas 3-4: RIR 2-3. Semana 5 en adelante: RIR 1-2. Si venís justo de tiempo recortá plancha, nunca sentadilla.',
      blocks: [
        {
          id: 'b1', type: 'straight', name: 'Series', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            kg('Sentadilla', 8, 12, 10, { sets: 3, rest: 90, why: W.legMod, rirMin: 2 }),
            kg('Peso muerto rumano', 8, 12, 10, { note: 'mancuernas, c/mano', sets: 3, rest: 90, why: W.hingeMod, rirMin: 2 }),
            kg('Estocadas', 8, 12, 0, { note: 'por pierna · sin peso, luego mancuernas', perSide: true, sets: 2, rest: 70, step: 1, why: W.unilateral }),
            time('Plancha', 20, 45, { sets: 3, rest: 45, why: W.core })
          ]
        }
      ]
    },
    {
      id: 'fase2-d2',
      name: 'Fase 2 · Día 2 · Torso',
      subtitle: 'Supersets · ~29′',
      active: false,
      rirMin: 2, rirMax: 3,
      warmup: 'Cinta 5′ igual al Día 1; el último minuto: círculos de brazos y rotaciones de hombro.',
      notes: 'En cada ronda del superset B: remo derecha → remo izquierda → press → descanso.',
      blocks: [
        {
          id: 'b1', type: 'circuit', name: 'Superset A', rounds: 3, restBetween: 0, restAfterRound: 70,
          exercises: [
            kg('Jalón dorsal', 8, 12, 4, { unit: 'ladrillos', step: 1, why: W.pull }),
            kg('Banco plano con mancuernas', 10, 15, 6, { note: 'c/mano', step: 1, why: W.pressRe })
          ]
        },
        {
          id: 'b2', type: 'circuit', name: 'Superset B', rounds: 3, restBetween: 0, restAfterRound: 75,
          exercises: [
            kg('Remo a 1 mano', 8, 12, 10, { perSide: true, step: 1, why: W.pull }),
            kg('Press militar con mancuernas', 8, 12, 5, { note: 'c/mano · parado o sentado', step: 1, why: W.ohp })
          ]
        },
        {
          id: 'b3', type: 'straight', name: 'Cierre', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            kg('Elevaciones laterales', 12, 15, 4, { note: 'c/mano', sets: 2, rest: 50, step: 1, why: W.shoulderIso }),
            kg('Curl de bíceps', 10, 15, 4, { note: 'opcional si sobra tiempo', sets: 2, rest: 45, step: 1, why: W.arms })
          ]
        }
      ]
    },
    {
      id: 'alt-a',
      name: 'Alternativa · Full body A',
      subtitle: 'Sentadilla + empuje/tracción · ~28′',
      active: false,
      rirMin: 2, rirMax: 3,
      warmup: 'Cinta 5′ progresiva + 10 sentadillas sin peso + 1 serie liviana del primer ejercicio.',
      notes: 'Propuesta para fuerza y salud: 3 veces por semana alternando A-B-A / B-A-B. Sentadilla y peso muerto en 6-10 reps con descanso largo y RIR 2 mínimo; el resto en 8-12.',
      blocks: [
        {
          id: 'b1', type: 'straight', name: 'Principal', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            kg('Sentadilla', 6, 10, 15, { note: 'barra o goblet', sets: 3, rest: 105, why: W.legHeavy, rirMin: 2 })
          ]
        },
        {
          id: 'b2', type: 'circuit', name: 'Superset', rounds: 3, restBetween: 0, restAfterRound: 75,
          exercises: [
            kg('Banco plano con mancuernas', 8, 12, 7.5, { note: 'c/mano', step: 1, why: W.press }),
            kg('Jalón dorsal', 8, 12, 4, { unit: 'ladrillos', step: 1, why: W.pull })
          ]
        },
        {
          id: 'b3', type: 'straight', name: 'Core', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            time('Plancha lateral', 20, 40, { note: 'por lado', perSide: true, sets: 2, rest: 30, why: W.core })
          ]
        }
      ]
    },
    {
      id: 'alt-b',
      name: 'Alternativa · Full body B',
      subtitle: 'Bisagra + press/remo + carry · ~28′',
      active: false,
      rirMin: 2, rirMax: 3,
      warmup: 'Cinta 5′ progresiva + 10 buenos días sin peso + círculos de brazos.',
      notes: 'Farmer carry: caminá 30-40″ con una mancuerna pesada en cada mano, tronco firme. Si no hay lugar, marchá en el lugar.',
      blocks: [
        {
          id: 'b1', type: 'straight', name: 'Principal', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            kg('Peso muerto rumano', 6, 10, 15, { note: 'barra o mancuernas', sets: 3, rest: 105, why: W.hingeHeavy, rirMin: 2 })
          ]
        },
        {
          id: 'b2', type: 'circuit', name: 'Superset', rounds: 3, restBetween: 0, restAfterRound: 75,
          exercises: [
            kg('Press militar con mancuernas', 8, 12, 5, { note: 'c/mano', step: 1, why: W.ohp }),
            kg('Remo a 1 mano', 8, 12, 10, { perSide: true, step: 1, why: W.pull })
          ]
        },
        {
          id: 'b3', type: 'straight', name: 'Carry', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [
            time('Farmer carry', 30, 40, { note: 'mancuerna en cada mano', unit: 'kg', target: 12.5, step: 2.5, sets: 3, rest: 60, why: W.carry })
          ]
        }
      ]
    },
    {
      id: 'fase3-upper-a',
      name: 'Fase 3 · Upper A',
      subtitle: '4 días/sem · torso, énfasis horizontal · ~27′',
      active: false,
      rirMin: 1, rirMax: 2,
      warmup: 'Cinta 5′ progresiva + círculos de brazos y rotaciones de hombro + 1 serie liviana del primer superset.',
      notes: 'Semana: Upper A · Lower A · (descanso) · Upper B · Lower B. Mínimo 48 h entre los dos días de torso. RIR objetivo 2; el cierre se recorta primero si falta tiempo. Descarga (mitad de series) cada 6-8 semanas.',
      blocks: [
        { id: 'b1', type: 'circuit', name: 'Superset A', rounds: 3, restBetween: 0, restAfterRound: 90,
          exercises: [ kg('Banco plano con mancuernas', 8, 12, 10, { note: 'c/mano', step: 1, why: W.press }), kg('Remo a 1 mano', 6, 10, 15, { perSide: true, step: 1, why: W.pullHeavy }) ] },
        { id: 'b2', type: 'circuit', name: 'Superset B', rounds: 3, restBetween: 0, restAfterRound: 75,
          exercises: [ kg('Press militar con mancuernas', 8, 12, 7.5, { note: 'c/mano', step: 1, why: W.ohp }), kg('Jalón dorsal', 8, 12, 5, { unit: 'ladrillos', step: 1, why: W.pull }) ] },
        { id: 'b3', type: 'circuit', name: 'Cierre', rounds: 2, restBetween: 0, restAfterRound: 45,
          exercises: [ kg('Face pull', 12, 15, 0, { note: 'polea; si no hay, elevaciones posteriores', step: 1, why: W.facepull }), kg('Curl de bíceps', 10, 15, 5, { note: 'c/mano', step: 1, why: W.arms }) ] }
      ]
    },
    {
      id: 'fase3-lower-a',
      name: 'Fase 3 · Lower A',
      subtitle: '4 días/sem · piernas, énfasis sentadilla · ~29′',
      active: false,
      rirMin: 1, rirMax: 2,
      warmup: 'Cinta 5′ progresiva + 10 sentadillas sin peso + 1-2 series de aproximación de sentadilla (50 % y 75 % del peso de trabajo).',
      notes: 'Sentadilla pesada primero (6-10 reps, RIR 2 mínimo: la guía lo aplica aunque la fase pida 1-2). Peso muerto rumano moderado. Mínimo 48 h antes de Lower B.',
      blocks: [
        { id: 'b1', type: 'straight', name: 'Principal', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [ kg('Sentadilla', 6, 10, 25, { note: 'barra o goblet', sets: 4, rest: 120, why: W.legHeavy, rirMin: 2 }), kg('Peso muerto rumano', 8, 12, 25, { note: 'barra o mancuernas', sets: 3, rest: 90, why: W.hingeMod, rirMin: 2 }) ] },
        { id: 'b2', type: 'circuit', name: 'Superset', rounds: 2, restBetween: 0, restAfterRound: 60,
          exercises: [ kg('Estocada hacia atrás', 8, 12, 0, { note: 'por pierna; mancuernas cuando sea fácil', perSide: true, step: 1, why: W.unilateral }), time('Plancha lateral', 20, 40, { note: 'por lado', perSide: true, why: W.core }) ] }
      ]
    },
    {
      id: 'fase3-upper-b',
      name: 'Fase 3 · Upper B',
      subtitle: '4 días/sem · torso, énfasis vertical · ~27′',
      active: false,
      rirMin: 1, rirMax: 2,
      warmup: 'Cinta 5′ progresiva + círculos de brazos y rotaciones de hombro + 1 serie liviana del primer superset.',
      notes: 'Jalón pesado (6-10); press militar en 8-12 para cuidar el hombro. Banco inclinado o flexiones y remo con apoyo moderados. El cierre se recorta primero.',
      blocks: [
        { id: 'b1', type: 'circuit', name: 'Superset A', rounds: 3, restBetween: 0, restAfterRound: 90,
          exercises: [ kg('Jalón dorsal', 6, 10, 6, { unit: 'ladrillos', step: 1, why: W.pullHeavy }), kg('Press militar con mancuernas', 8, 12, 7.5, { note: 'c/mano', step: 1, why: W.ohp }) ] },
        { id: 'b2', type: 'circuit', name: 'Superset B', rounds: 3, restBetween: 0, restAfterRound: 75,
          exercises: [ kg('Banco inclinado con mancuernas', 8, 12, 7.5, { note: 'c/mano; o flexiones de brazos', step: 1, why: W.press }), kg('Remo con apoyo en banco', 8, 12, 10, { note: 'pecho apoyado, o remo sentado en polea', step: 1, why: W.pull }) ] },
        { id: 'b3', type: 'circuit', name: 'Cierre', rounds: 2, restBetween: 0, restAfterRound: 45,
          exercises: [ kg('Elevaciones laterales', 12, 15, 5, { note: 'c/mano', step: 1, why: W.shoulderIso }), kg('Extensión de tríceps en polea', 12, 15, 0, { note: 'o face pull', step: 1, why: W.arms }) ] }
      ]
    },
    {
      id: 'fase3-lower-b',
      name: 'Fase 3 · Lower B',
      subtitle: '4 días/sem · piernas, énfasis bisagra · ~29′',
      active: false,
      rirMin: 1, rirMax: 2,
      warmup: 'Cinta 5′ progresiva + 10 buenos días sin peso + 1-2 series de aproximación de peso muerto.',
      notes: 'Peso muerto rumano pesado primero (6-10 reps, RIR 2 mínimo: la guía lo aplica aunque la fase pida 1-2). Sentadilla goblet o búlgara moderada. Puente de glúteo + farmer carry para cerrar.',
      blocks: [
        { id: 'b1', type: 'straight', name: 'Principal', rounds: 1, restBetween: 0, restAfterRound: 0,
          exercises: [ kg('Peso muerto rumano', 6, 10, 30, { note: 'barra o mancuernas', sets: 4, rest: 120, why: W.hingeHeavy, rirMin: 2 }), kg('Sentadilla goblet', 8, 12, 15, { note: 'o sentadilla búlgara por pierna', sets: 3, rest: 90, why: W.legMod, rirMin: 2 }) ] },
        { id: 'b2', type: 'circuit', name: 'Superset', rounds: 2, restBetween: 0, restAfterRound: 60,
          exercises: [ kg('Puente de glúteo', 10, 15, 10, { note: 'mancuerna sobre la cadera', step: 2.5, why: W.glute }), time('Farmer carry', 30, 40, { note: 'mancuerna en cada mano', unit: 'kg', target: 15, step: 2.5, why: W.carry }) ] }
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
