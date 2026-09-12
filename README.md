# Gimnasio

App para el celular (PWA) para registrar el entrenamiento: rutinas, pesos, reps, sensación de cada serie y calendario de asistencia. Todo se guarda en el teléfono, sin cuentas ni servidor.

## Qué hace

- **Hoy**: muestra como próxima sesión la última rutina que empezaste (queda fijada hasta que elijas otra; si nunca empezaste ninguna, sugiere entre las activas la que hace más tiempo no hacés), la cadencia (esta semana, últimas 4, semanas seguidas) y las últimas sesiones.
- **Sesión**: te va diciendo el ejercicio, con el rango de reps y lo que hiciste la última vez (peso × reps y sensación por serie). Peso y reps vienen ya cargados (las reps que anotaste en la serie anterior de hoy; en la primera serie, las de esa misma serie la última vez, o el piso del rango si nunca lo hiciste; el peso de hoy, de la última vez o el objetivo), así que normalmente solo ajustás con + / − y marcás la sensación, que es obligatoria: sin ella no se guarda la serie, porque la guía la necesita para evaluar la exigencia. Al guardar pasa directo al siguiente ejercicio, con el descanso corriendo en una barra arriba (−15″ / +15″ / omitir) que avisa con vibración y sonido cuando termina; no hay pantalla de descanso aparte, así que es un solo toque por serie. En los ejercicios por tiempo (plancha) fijás los segundos objetivo, tocás **Iniciar cuenta regresiva** y te avisa al cumplirlos (con un tic en los últimos 3 segundos); si parás antes, quedan anotados los segundos que aguantaste. Si el aparato está ocupado, **Después ↷** pasa ese ejercicio detrás del que sigue (en series seguidas, todas las series que le quedan): hacés el otro y la app te vuelve a traer el pospuesto. Se puede tocar varias veces para seguir corriéndolo. La pantalla del ejercicio está pensada para entrar entera en un teléfono de ~6,5″ sin scroll: descanso, evaluación de la serie anterior, objetivo, historial, peso y reps lado a lado, sensación y botones; los textos largos (guía, por qué del rango) se pliegan a dos líneas y se abren con un toque, o solos si sobra lugar.
- **Guía de doble progresión**: cada rutina tiene un RIR objetivo (3-4 al reengancharte, 2-3 después, 1-2 en fases fuertes; se edita en la rutina). En cada serie la app te dice el objetivo (mismo peso y una rep más, repetir el tope, subir la carga y volver al piso del rango, bajar, o cortar antes si venís más al límite de lo que pide la fase) y, al guardarla, evalúa lo que hiciste: progreso contra la misma serie de la última vez y exigencia contra el RIR objetivo. La carga sube cuando dos sesiones seguidas llegan al tope del rango en todas las series sin pasarse del RIR; si además sobró, con una alcanza. Si volvés después de 5 días, esa sesión va a RIR 3. Un ejercicio puede tener un **RIR mínimo propio** más alto que el de la fase (sentadilla y peso muerto: 2, para cuidar columna y rodillas): la guía evalúa esas series contra ese piso y lo avisa antes de empezar. El resumen cierra con un veredicto por ejercicio y la decisión para la próxima vez.
- **Rangos de repeticiones**: pensados para estímulo alto con articulaciones cuidadas. Compuestos de pierna pesados (sentadilla, peso muerto) 6-10 con RIR 2 mínimo; moderados y reenganche 8-12; empujes 8-12 (10-15 al reengancharte); tracción principal del día 6-10, el resto 8-12; hombro aislado 12-15; brazos 10-15; core por tiempo. Nunca menos de 6 reps con carga. Cada ejercicio muestra en la sesión **por qué** tiene ese rango (se edita en la rutina), la pestaña Rutinas tiene la guía resumida y el editor avisa si un ejercicio queda por debajo de 6. El detalle con referencias está en [docs/rangos-de-repeticiones.pdf](docs/rangos-de-repeticiones.pdf).
- **Rutinas**: editor de bloques (circuito/superset o series) con ejercicios, rangos, motivo del rango, carga objetivo, descansos y RIR mínimo propio. Vienen cargadas tus rutinas de Fase 1, Fase 2 (Día 1 y Día 2), una alternativa full body A/B para 3 días y la Fase 3 de 4 días (Upper A / Lower A / Upper B / Lower B). En los teléfonos ya instalados, al abrir la versión nueva los rangos que cambiaron se actualizan solos si seguían con el valor anterior (lo que editaste a mano no se toca) y se completan motivos y pisos de RIR. **Datos → Restaurar rutinas de ejemplo** reemplaza las de ejemplo por la versión actual (conserva si estaban activas) y agrega las que falten; las rutinas propias y las sesiones no se tocan.
- **Calendario**: días entrenados, marcar días a mano, días por semana.
- **Datos**: exportar/importar JSON (copia de seguridad y base para estadísticas), preferencias (sonido, vibración, voz, pantalla encendida, tema).

La sensación se guarda como RIR (reps en reserva): Liviano = 4+, Cómodo = 3, Justo = 2, Pesado = 1, Al límite = 0.

## Cómo instalarla en el celular

La app es una página web instalable. Necesita estar publicada en una URL con HTTPS (gratis con GitHub Pages):

1. Creá un repositorio en GitHub y subí esta carpeta (`git init`, `git add .`, `git commit`, `git push`).
2. En el repo: **Settings → Pages → Source: Deploy from a branch → main / (root)**. Guardá.
3. Abrí `https://<tu-usuario>.github.io/<repo>/` en Chrome del celular.
4. Menú ⋮ → **Instalar aplicación** (o «Agregar a pantalla principal»).

Después abre a pantalla completa desde el ícono y funciona sin internet. Cualquier otro hosting estático (Netlify, Cloudflare Pages, Vercel) sirve igual: es una carpeta de archivos estáticos.

Para probar en la compu: `python3 -m http.server 8000` o `npx serve .` dentro de la carpeta, y abrir `http://localhost:8000`.

## Documentos

- [docs/rangos-de-repeticiones.pdf](docs/rangos-de-repeticiones.pdf) (fuente LaTeX en `docs/rangos-de-repeticiones.tex`): el rango de repeticiones de cada ejercicio y el motivo, con el criterio general (carga por repetición, RIR, técnica), los cambios respecto de las rutinas anteriores y las referencias. Para recompilarlo: `cd docs && pdflatex rangos-de-repeticiones.tex` (dos veces, para las citas). Necesita TeX Live con `babel-spanish`, `booktabs`, `longtable`, `enumitem`, `microtype` y `hyperref`.
- [docs/repetition-ranges.pdf](docs/repetition-ranges.pdf) (fuente LaTeX en `docs/repetition-ranges.tex`): la misma prescripción en inglés, redactada como informe de investigación (resumen, revisión de literatura, metodología, resultados, discusión y conclusión, citas APA autor-año con DOI). Se recompila igual, dos veces; usa `natbib`, `caption` y `babel` británico.
- `docs/training-programme-report.pdf` (fuente `docs/training-programme-report.tex`, no versionado): el informe en inglés que explica y justifica cada rutina, las consideraciones y las expectativas de mejora. Se recompila igual, dos veces.

## Archivos

- `index.html` — estructura y carga de scripts.
- `app.css` — estilos (tema oscuro por defecto, claro según el sistema).
- `logic.js` — lógica pura: cola de series, historial, regla de progresión, estadísticas, formatos.
- `seed.js` — rutinas iniciales (con el rango, el motivo y el piso de RIR de cada ejercicio) y las dos primeras sesiones (31/8 y 4/9, solo pesos).
- `docs/` — documentos LaTeX y PDF.
- `app.js` — pantallas, estado y persistencia (localStorage).
- `sw.js`, `manifest.webmanifest`, `icons/` — lo que hace que sea instalable y funcione sin internet.
- `tools/make-icons.js` — regenera los íconos PNG (`node tools/make-icons.js`).

Cuando cambies archivos ya publicados, subí `VERSION` en `sw.js` para que los teléfonos instalados tomen la versión nueva.

## Datos

Se guardan en `localStorage` bajo la clave `gimnasio.v1` (rutinas, sesiones, preferencias) y `gimnasio.live` (sesión en curso). Exportá desde **Datos → Copiar JSON / Descargar / Compartir** cada tanto: si borrás los datos de Chrome, se pierde lo guardado. **Compartir** manda el JSON como archivo `gimnasio-<fecha>.json.txt` (Chrome no deja compartir archivos `.json`, pero sí de texto); al importar se acepta igual que un `.json`.

Cada ejercicio de una rutina guarda `min`/`max` (rango), `why` (motivo del rango, texto libre) y `rirMin` (piso de RIR propio, o `null` para usar el de la rutina). La versión de datos es 2; al cargar datos de la versión 1 se aplican los rangos nuevos donde no hubo edición manual.

Formato de una serie guardada:

```json
{ "key": "sentadilla", "name": "Sentadilla", "mode": "reps", "unit": "kg", "perSide": false,
  "round": 2, "setNo": 2, "setsTotal": 3, "load": 15, "reps": 10, "rir": 2, "t": "2026-09-04T19:22:00.000Z" }
```

## Pasar a APK nativo (si hace falta)

La misma carpeta se puede envolver sin reescribir nada: con [Capacitor](https://capacitorjs.com/) (`npx cap add android`) o como Trusted Web Activity con [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap). Hace falta Android Studio o el SDK de Android para compilar.
