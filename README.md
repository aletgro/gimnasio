# Gimnasio

App para el celular (PWA) para registrar el entrenamiento: rutinas, pesos, reps, sensación de cada serie y calendario de asistencia. Todo se guarda en el teléfono, sin cuentas ni servidor.

## Qué hace

- **Hoy**: sugiere la próxima rutina (entre las activas, la que hace más tiempo no hacés), muestra la cadencia (esta semana, últimas 4, semanas seguidas) y las últimas sesiones.
- **Sesión**: te va diciendo el ejercicio, con el rango de reps y lo que hiciste la última vez (peso × reps y sensación por serie). Peso y reps vienen ya cargados (las reps que anotaste en la serie anterior de hoy; en la primera serie, las de esa misma serie la última vez, o el piso del rango si nunca lo hiciste; el peso de hoy, de la última vez o el objetivo), así que normalmente solo ajustás con + / − y marcás la sensación. Al guardar pasa directo al siguiente ejercicio, con el descanso corriendo en una barra arriba (−15″ / +15″ / omitir) que avisa con vibración y sonido cuando termina; no hay pantalla de descanso aparte, así que es un solo toque por serie. En los ejercicios por tiempo (plancha) fijás los segundos objetivo, tocás **Iniciar cuenta regresiva** y te avisa al cumplirlos (con un tic en los últimos 3 segundos); si parás antes, quedan anotados los segundos que aguantaste. Si el aparato está ocupado, **Hacer después** pasa ese ejercicio detrás del que sigue (en series seguidas, todas las series que le quedan): hacés el otro y la app te vuelve a traer el pospuesto. Se puede tocar varias veces para seguir corriéndolo.
- **Progresión**: cuando dos sesiones seguidas completás el tope del rango en todas las series con RIR ≤ 2, te avisa que subas la carga (doble progresión).
- **Rutinas**: editor de bloques (circuito/superset o series) con ejercicios, rangos, carga objetivo y descansos. Vienen cargadas tus rutinas de Fase 1, Fase 2 (Día 1 y Día 2), una alternativa full body A/B para 3 días y la Fase 3 de 4 días (Upper A / Lower A / Upper B / Lower B). Si la app ya tenía datos, las nuevas aparecen con **Datos → Restaurar rutinas de ejemplo**.
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

## Informe

En [docs/training-programme-report.pdf](docs/training-programme-report.pdf) (fuente LaTeX en `docs/training-programme-report.tex`) está el informe en inglés que explica y justifica cada rutina, las consideraciones y las expectativas de mejora. Para recompilarlo: `cd docs && pdflatex training-programme-report.tex` (dos veces, para las referencias cruzadas).

## Archivos

- `index.html` — estructura y carga de scripts.
- `app.css` — estilos (tema oscuro por defecto, claro según el sistema).
- `logic.js` — lógica pura: cola de series, historial, regla de progresión, estadísticas, formatos.
- `seed.js` — rutinas iniciales y las dos primeras sesiones (31/8 y 4/9, solo pesos).
- `app.js` — pantallas, estado y persistencia (localStorage).
- `sw.js`, `manifest.webmanifest`, `icons/` — lo que hace que sea instalable y funcione sin internet.
- `tools/make-icons.js` — regenera los íconos PNG (`node tools/make-icons.js`).

Cuando cambies archivos ya publicados, subí `VERSION` en `sw.js` para que los teléfonos instalados tomen la versión nueva.

## Datos

Se guardan en `localStorage` bajo la clave `gimnasio.v1` (rutinas, sesiones, preferencias) y `gimnasio.live` (sesión en curso). Exportá desde **Datos → Copiar JSON / Descargar** cada tanto: si borrás los datos de Chrome, se pierde lo guardado.

Formato de una serie guardada:

```json
{ "key": "sentadilla", "name": "Sentadilla", "mode": "reps", "unit": "kg", "perSide": false,
  "round": 2, "setNo": 2, "setsTotal": 3, "load": 15, "reps": 10, "rir": 2, "t": "2026-09-04T19:22:00.000Z" }
```

## Pasar a APK nativo (si hace falta)

La misma carpeta se puede envolver sin reescribir nada: con [Capacitor](https://capacitorjs.com/) (`npx cap add android`) o como Trusted Web Activity con [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap). Hace falta Android Studio o el SDK de Android para compilar.
