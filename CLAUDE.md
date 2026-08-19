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

Tomada del escudo que envió el cliente (`assets/img/escudo.png`). Diseño **mobile-first**
y **solo tema oscuro** — es la identidad de la marca, no una preferencia del usuario.

**Los colores se extrajeron del PNG, no se inventaron.** Se midió el tono dominante de
cada uno de los cinco cuadros del escudo y se aclaró lo justo para que contraste sobre
fondo oscuro:

| Cuadro | Tono | Variable CSS | Valor |
|---|---|---|---|
| L | 133° verde | `--ldfaf-verde` | `#28ad46` |
| D | 214° azul | `--ldfaf-azul` | `#2861ad` |
| F | gris | `--ldfaf-grafito` | `#2c2c2e` |
| A | 267° morado | `--ldfaf-morado` | `#6528ad` |
| F | 2° rojo | `--ldfaf-rojo` | `#ad2c28` |

El **color principal de acción** es `--neon: #34c85c`, el verde del escudo aclarado
(contraste 9.0:1 sobre el fondo). Una versión anterior usaba un verde lima neón
(`#9ee641`) que no estaba en el logo: venía de una infografía de referencia. Cambiar el
color principal es tocar una sola variable.

### Los archivos del escudo

| Archivo | Tamaño | Dónde se usa |
|---|---|---|
| `assets/img/escudo.png` | 512×512, 175 KB | portada |
| `assets/img/escudo-mini.png` | 128×128, 15 KB | cabecera |

Salen del original de 1254×1254 y 1,2 MB, reducidos para no castigar el móvil.

⚠️ **El PNG no tiene transparencia**: su fondo es negro sólido. Por eso los contenedores
`.marca__escudo` y `.hero__escudo` van con `background: #000`, para que no se recorte una
caja negra sobre el fondo del sitio. Si el cliente envía una versión con fondo
transparente, se puede quitar ese negro.

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
| Auth | `data/usuarios.json` + `sesion.js` (**solo demostración**) | Supabase Auth: organizador y dirigentes |
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

## Modelo de negocio

Es un **SaaS de gestión de torneos**, no la web de una sola liga:

- **Organizar un torneo es de pago.** Crear torneos, abrir categorías y fijar los plazos
  requiere una membresía activa.
- **Inscribir un club es gratis.** El organizador da el acceso a cada dirigente.
- **La liga es pública.** Clasificación, calendario, clubes y goleadores se ven sin cuenta.

El recorrido es el de cualquier SaaS: **portada que explica el producto → entrar →
planes si hace falta → panel**. El panel del organizador no se enseña a quien no ha pagado.

⚠️ **Los precios de `data/planes.json` son de ejemplo.** Hay que confirmarlos con el
cliente antes de presentarlo. Están en un JSON aparte justo para poder cambiarlos sin
tocar código.

En el demo, contratar activa la membresía al momento y no cobra nada. En producción lo
confirmará la pasarela de pago mediante un webhook contra el servidor, nunca el navegador.

## Acceso (demo) — no es seguridad

Hay login para que el cliente vea el flujo completo, pero **no protege nada**:

- Las credenciales están en `data/usuarios.json` en texto plano, y el repositorio es
  público: cualquiera puede leerlas.
- Todo se comprueba en el navegador, así que se salta con las herramientas de desarrollo.
- La pantalla de acceso **enseña las cuentas a propósito**, para que el cliente pueda
  probar sin recordar nada, y avisa de que no use una contraseña real.

| Usuario | Contraseña | Rol | Ve |
|---|---|---|---|
| `organizador` | `fugaz2026` | organizador **con** membresía | toda la liga |
| `nuevo` | `nuevo2026` | organizador **sin** membresía | ve la puerta de pago |
| `riberas`, `valdehierro`, `penalba`, `sanroque`, `lamata`, `molinos`, `fuentevieja`, `elrobledal`, `torrecilla`, `vegaalta` | `club2026` | dirigente | solo su club |

Qué se puede ver sin entrar: la portada, los planes y la liga (clasificación, calendario,
clubes y goleadores).

La cuenta `nuevo` existe para poder enseñar el muro de pago: entra, no tiene membresía y
la web le lleva a los planes en vez de al panel.

**`assets/js/sesion.js` es el único archivo que hay que reescribir** para pasar a Supabase
Auth. El resto del sitio solo llama a `Sesion.actual()`, `Sesion.esOrganizador()` y
`Sesion.puedeGestionarClub()`. En producción, quién puede ver o tocar cada nómina lo
decidirán las políticas RLS de la base de datos, no ese archivo.

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
index.html                una sola página, router por hash
                          #/ portada · #/planes · #/entrar · #/liga · #/inscripcion · #/organizador
data/*.json               datos semilla
assets/js/data.js         ← CAPA DE DATOS + REGLAS DE NEGOCIO. Punto de migración.
assets/js/sesion.js       ← ACCESO Y ROLES. Punto de migración a Supabase Auth.
assets/js/acceso.js       pantalla de entrar
assets/js/inicio.js       portada pública que explica el producto
assets/js/membresia.js    planes y muro de pago del organizador
assets/js/inscripcion.js  portal del dirigente (3 pasos: club → categoría → nómina)
assets/js/organizador.js  panel del organizador (torneos, categorías, plazos, inscritos)
assets/js/liga.js         cálculo de clasificación y goleadores
assets/js/ui.js           vistas de competición + utilidades compartidas
assets/js/panel.js        carga de resultados de partidos
assets/css/estilos.css
assets/img/escudo*.png     escudo del cliente, en dos tamaños
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
usuarios.json      cuentas del demo, con su estado de membresía
planes.json        planes y precios (PRECIOS DE EJEMPLO, confirmar con el cliente)
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
