# Liga de Fútbol Amateur Fugaz (LDFAF)

Plataforma para gestionar los torneos de una liga de fútbol amateur de pueblo.
Cliente real, tráfico bajo.

## Estado del proyecto

**Fase actual: demo para presentar al cliente.** Debe verse bien y funcionar de verdad —
el objetivo es que el cliente valide que es lo que busca. Tras su aprobación se compra
dominio y se pasa a producción con base de datos real.

## Lo que pidió el cliente

Textualmente, por WhatsApp:

1. *"Quiero que el dirigente entre y se inscriban a sus jugadores, ponga el logo del club
   y nombre y apellidos, edad, número de cédula."*
2. *"Coloque el torneo: Copa Fugaz Fútbol 7, Copa Fugaz Fútbol 11, Copa Fugaz categoría
   sub 12... Que haya alguna categorías. Desde las sub 8 hasta las sub 40."*
3. *"Que el dirigente pueda inscribir a sus jugadores hasta una fecha límite que yo ponga
   como organizador."*

De ahí salen los **dos tipos de usuario** del sistema:

| | Organizador (el cliente) | Dirigente (cada club) |
|---|---|---|
| Crea torneos y categorías | ✅ | — |
| Fija la fecha límite de inscripción | ✅ | — |
| Ve los inscritos y sus nóminas | ✅ | solo la suya |
| Registra el club | — | ✅ |
| Carga la nómina de jugadores | — | ✅ |

La competición (clasificación, calendario, goleadores) es la fase siguiente, que arranca
cuando el torneo ya tiene equipos inscritos.

## Identidad visual

Tomada del escudo que envió el cliente: **fondo oscuro metálico, verde neón como color
principal** y los cuatro colores de LDFAF (verde, azul, ámbar, rojo) para distinguir
categorías y estados. Diseño **mobile-first** y **solo tema oscuro** — es la identidad de
la marca, no una preferencia del usuario.

⚠️ **Falta el logo real.** Ahora hay un escudo SVG de relleno en `index.html`. Cuando el
cliente envíe el archivo, ponerlo en `assets/img/escudo.png` y sustituir ese bloque.

## Flujo de trabajo

```
requisitos → implementación → validación → commit/push → GitHub → deploy
```

La validación va **antes** del commit. No se pushea nada sin comprobar que funciona.

## Stack

| Capa | Ahora (demo) | Producción (tras aprobación) |
|---|---|---|
| Código | GitHub — `SantyCloud/copa-fugaz` (**público**) | igual, valorar volverlo privado |
| Front | HTML/CSS/JS puro, sin build | igual |
| Datos | JSON en `data/` + `localStorage` | Supabase (Postgres) |
| Auth | ninguna (demo abierto) | Supabase Auth: organizador y dirigentes |
| Ficheros | — | Supabase Storage (logos de club) |
| Permisos | — | Supabase RLS |
| Deploy | Cloudflare Pages o GitHub Pages | + dominio propio |

El repo se hizo público a petición del cliente para poder usar GitHub Pages en plan
gratuito. Cloudflare Pages también sirve y acepta repos privados sin coste.

## ⚠️ Datos personales — regla crítica

El sistema guarda **nombre, apellidos, edad y número de cédula**, y hay categorías desde
**Sub-8**: son datos personales de menores de edad.

- **Todas las cédulas del repo son inventadas.** No corresponden a personas reales.
- **Nunca commitear datos reales de jugadores.** El repositorio es público: un commit con
  cédulas auténticas quedaría expuesto y cacheado para siempre aunque se borre después.
- En producción, esos datos van en Supabase con RLS, nunca en el repositorio.

## Reglas del proyecto

- Revisar el estado actual antes de modificar. No recrear configuraciones existentes.
- **Cero dependencias** salvo justificación explícita. No hay `package.json` y no debería
  haberlo mientras no haga falta.
- Nunca commitear secretos. Las claves de Supabase/Cloudflare van en variables de entorno
  del panel de hosting, jamás en el repo.
- El contexto permanente vive en este archivo.

## Arquitectura

Todo el acceso a datos pasa por **`assets/js/data.js`**. Es el único punto que habrá que
tocar para migrar a Supabase — el resto del sitio no se entera de dónde salen los datos.

```
index.html                una sola página, router por hash (#/, #/inscripcion, ...)
data/*.json               datos semilla
assets/js/data.js         ← CAPA DE DATOS + REGLAS DE NEGOCIO. Punto de migración.
assets/js/inscripcion.js  portal del dirigente (3 pasos: club → categoría → nómina)
assets/js/organizador.js  panel del organizador (torneos, categorías, plazos, inscritos)
assets/js/liga.js         cálculo de clasificación y goleadores
assets/js/ui.js           vistas de competición + utilidades compartidas
assets/js/panel.js        carga de resultados de partidos
assets/css/estilos.css
```

### Dos decisiones que conviene no romper

**1. Las reglas viven en `data.js`, no en las vistas.** La fecha límite, el rango de edad
de la categoría, la cédula sin repetir y el cupo se comprueban en la capa de datos. Las
vistas solo enseñan el resultado. Está verificado que saltarse la interfaz y llamar a
`Datos.agregarJugador()` directamente también falla si el plazo cerró. Al migrar a
Supabase, esas mismas reglas pasan a ser constraints y políticas RLS.

**2. Los datos derivados nunca se guardan.** La clasificación y la tabla de goleadores se
calculan siempre a partir de los partidos. Así no hay forma de que queden desincronizadas.

### Modelo de datos

```
torneos.json       torneo → [categorías]   (cada categoría con su fechaLimite)
clubes.json        club + su dirigente
inscripciones.json club × categoría → estado (borrador | enviada | aprobada)
jugadores.json     jugador → inscripcionId (y equipoId si compite en la liga en curso)
partidos.json      calendario y resultados
torneo.json        descriptor de la competición que se está jugando
```

`equipoId` en `jugadores.json` se mantiene aparte de `inscripcionId` por compatibilidad
con las vistas de competición: solo lo tienen los jugadores del torneo que ya se disputa.

## Datos semilla

Clubes, jugadores y cédulas son **inventados y realistas**, pensados para la presentación.
Están montados para que el cliente vea los tres estados de un plazo a la vez: una
categoría cerrada, varias abiertas y una que cierra en pocos días.

Para sustituirlos por los reales basta con editar los JSON de `data/` — no hace falta
tocar código. Leer antes la sección de datos personales.

## Cómo levantar el sitio en local

No hay build. Hace falta un servidor porque el sitio carga JSON con `fetch` y `file://`
lo bloquea.

```
python -m http.server 8000
```

## Convenciones

- Idioma de la interfaz y de los datos: **español**.
- Mensajes de commit en español, formato `tipo: descripción`.
- Nombres de archivos y de campos JSON en español y en minúsculas.
