# Copa Fugaz

Web para gestionar un campeonato de fútbol de pueblo. Cliente real, tráfico bajo.

## Estado del proyecto

**Fase actual: demo para presentar al cliente.** Debe verse bien y funcionar de verdad —
el objetivo es que el cliente valide que es lo que busca. Tras su aprobación se compra
dominio y se pasa a producción.

## Flujo de trabajo

```
requisitos → implementación → validación → commit/push → GitHub → deploy
```

La validación va **antes** del commit. No se pushea nada sin comprobar que funciona.

## Stack

| Capa | Ahora (demo) | Producción (tras aprobación) |
|---|---|---|
| Código | GitHub — `SantyCloud/copa-fugaz` (privado) | igual |
| Front | HTML/CSS/JS puro, sin build | igual |
| Datos | JSON en `data/` + `localStorage` | Supabase (Postgres) |
| Auth | Clave local en el panel admin | Supabase Auth |
| Ficheros | — | Supabase Storage |
| Permisos | — | Supabase RLS |
| Deploy | Cloudflare Pages (`*.pages.dev`) | Cloudflare Pages + dominio propio |

**GitHub Pages no es viable:** el repo es privado y la cuenta es plan free; Pages no
publica repos privados sin plan de pago. Por eso el deploy va a Cloudflare Pages, que sí
conecta repos privados gratis.

## Reglas del proyecto

- Revisar el estado actual antes de modificar. No recrear configuraciones existentes.
- **Cero dependencias** salvo justificación explícita. No hay `package.json` y no debería
  haberlo mientras no haga falta.
- Nunca commitear secretos. Las claves de Supabase/Cloudflare van en variables de entorno
  del panel de Cloudflare, jamás en el repo.
- El contexto permanente vive en este archivo.

## Arquitectura

Todo el acceso a datos pasa por **`assets/js/data.js`**. Es el único punto que habrá que
tocar para migrar a Supabase — el resto del sitio no se entera de dónde salen los datos.

```
index.html            una sola página, router por hash (#/, #/calendario, ...)
data/*.json           datos semilla del torneo
assets/js/data.js     ← CAPA DE DATOS. Punto de migración a Supabase.
assets/js/liga.js     cálculo de tabla de posiciones y goleadores
assets/js/ui.js       renderizado de las vistas
assets/css/estilos.css
```

**Los datos derivados nunca se guardan.** La tabla de posiciones y la de goleadores se
calculan siempre a partir de los partidos. Así no hay forma de que queden desincronizadas.

## Datos semilla

Los equipos y jugadores en `data/` son **inventados y realistas**, pensados para la
presentación. Sustituir por los reales del cliente editando `data/equipos.json` y
`data/jugadores.json` — no hace falta tocar código.

## Cómo levantar el sitio en local

No hay build. Cualquier servidor estático sirve; hace falta uno porque el sitio carga
JSON con `fetch` y `file://` lo bloquea.

```
python -m http.server 8000
```

## Convenciones

- Idioma de la interfaz y de los datos: **español**.
- Mensajes de commit en español, formato `tipo: descripción`.
- Nombres de archivos y de campos JSON en español y en minúsculas.
