/**
 * Renderizado de las vistas.
 *
 * Cada vista devuelve { html, activar? }. `activar` se ejecuta después de
 * insertar el HTML en el documento y sirve para enganchar eventos.
 *
 * No hay plantillas ni librerías: strings de HTML y `innerHTML`. Todo texto
 * que venga de los datos pasa por escapar() antes de insertarse.
 */

import { Datos } from './data.js';
import {
  calcularClasificacion,
  calcularGoleadores,
  agruparPorJornada,
  resumenTorneo,
  estadisticasEquipo,
} from './liga.js';

/* ─────────────────────────────── utilidades ────────────────────────────── */

/** Escapa texto para insertarlo en HTML sin riesgo de inyección. */
export function escapar(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Solo deja pasar colores hexadecimales; cualquier otra cosa cae al gris. */
function colorSeguro(valor, porDefecto = '#64748b') {
  return /^#[0-9a-fA-F]{3,8}$/.test(String(valor || '')) ? valor : porDefecto;
}

/** Blanco o negro, el que más contraste con el fondo dado. */
function textoSobre(hex) {
  const c = colorSeguro(hex).replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  // Luminancia relativa aproximada (ITU-R BT.601).
  return (r * 299 + g * 587 + b * 114) / 1000 > 145 ? '#111111' : '#ffffff';
}

/** Nombre completo del jugador, venga del formato viejo o del nuevo. */
export function nombreJugador(jugador) {
  if (!jugador) return '';
  return (
    jugador.nombreCompleto ||
    [jugador.nombre, jugador.apellidos].filter(Boolean).join(' ')
  );
}

/** Escudo del equipo: cuadro con el color del club y su abreviatura. */
export function escudo(equipo, clase = '') {
  if (!equipo) return `<span class="escudo ${escapar(clase)}"></span>`;
  const fondo = colorSeguro(equipo.colorPrimario);
  return (
    `<span class="escudo ${escapar(clase)}" aria-hidden="true" ` +
    `style="background:${fondo};color:${textoSobre(fondo)}">` +
    `${escapar(equipo.abreviatura)}</span>`
  );
}

/** "2026-03-07" → "sábado, 7 de marzo". Sin desfase de zona horaria. */
export function formatearFecha(iso, opciones) {
  if (!iso) return '';
  const [a, m, d] = String(iso).split('-').map(Number);
  if (!a || !m || !d) return escapar(iso);
  const fecha = new Date(a, m - 1, d);
  return fecha.toLocaleDateString(
    'es-ES',
    opciones || { weekday: 'long', day: 'numeric', month: 'long' }
  );
}

function bloqueVacio(icono, mensaje) {
  return `<div class="vacio"><div class="vacio__icono">${icono}</div><p>${escapar(mensaje)}</p></div>`;
}

/** Datos de la vista que casi todas necesitan. */
function contexto() {
  const equipos = Datos.getEquipos();
  const partidos = Datos.getPartidos();
  const torneo = Datos.getTorneo();
  return {
    equipos,
    partidos,
    torneo,
    jugadores: Datos.getJugadores(),
    clasificacion: calcularClasificacion(equipos, partidos, torneo),
    indiceEquipos: new Map(equipos.map((e) => [e.id, e])),
  };
}

function enlaceEquipo(equipo, contenido) {
  return `<a href="#/equipo/${escapar(equipo.id)}" class="celda-equipo">${contenido}</a>`;
}

/* ──────────────────────────── vista: portada ───────────────────────────── */

export function vistaInicio() {
  const { clasificacion, partidos, torneo, indiceEquipos } = contexto();
  const resumen = resumenTorneo(partidos, clasificacion);
  const jornadaActual = Datos.jornadaActual();

  const ultimos = partidos
    .filter((p) => p.estado === 'jugado' && p.jornada === jornadaActual)
    .slice(0, 5);

  const proximos = partidos
    .filter((p) => p.estado === 'pendiente')
    .sort((a, b) => a.jornada - b.jornada)
    .slice(0, 5);

  const abiertas = Datos.getCategorias().filter((c) => Datos.plazoAbierto(c).abierto).length;

  const hero = `
    <section class="hero">
      <div class="contenedor">
        <div class="hero__cabecera">
          <span class="hero__escudo">
            <img src="assets/img/escudo.png" width="116" height="116"
                 alt="Escudo de la Liga de Fútbol Amateur Fugaz">
          </span>
          <div>
            <span class="hero__etiqueta">Temporada ${escapar(torneo.temporada)}</span>
            <h1 class="hero__titulo">Liga de Fútbol<br>Amateur <em>Fugaz</em></h1>
            <p class="hero__sub">${escapar(torneo.descripcion)}</p>
          </div>
        </div>
        <div class="acciones" style="border:0;padding-top:16px;margin-top:0">
          <a class="boton" href="#/inscripcion">Inscribir mi club</a>
          <a class="boton boton--secundario" href="#/organizador">Panel del organizador</a>
        </div>
        ${
          abiertas
            ? `<div class="aviso aviso--info" style="margin:18px 0 0">
                 <span class="aviso__icono">📣</span>
                 <div>Hay <strong>${abiertas} categoría${abiertas === 1 ? '' : 's'}</strong>
                 con la inscripción abierta. <a href="#/inscripcion" style="color:var(--neon);font-weight:700">Ver plazos →</a></div>
               </div>`
            : ''
        }
        <div class="hero__stats">
          <div class="stat">
            <div class="stat__valor">${resumen.partidosJugados}<span class="tenue" style="font-size:.9rem">/${resumen.partidosTotales}</span></div>
            <div class="stat__etiqueta">Partidos jugados</div>
          </div>
          <div class="stat">
            <div class="stat__valor">${resumen.goles}</div>
            <div class="stat__etiqueta">Goles marcados</div>
          </div>
          <div class="stat">
            <div class="stat__valor">${resumen.promedioGoles}</div>
            <div class="stat__etiqueta">Goles por partido</div>
          </div>
          <div class="stat">
            <div class="stat__valor" style="font-size:1.05rem;font-family:var(--fuente)">${
              resumen.lider ? escapar(resumen.lider.equipo.nombre) : '—'
            }</div>
            <div class="stat__etiqueta">Líder</div>
          </div>
        </div>
      </div>
    </section>`;

  const html = `
    ${hero}
    <main class="principal">
      <div class="contenedor">
        <section class="seccion">
          <div class="seccion__cabecera">
            <h2 class="seccion__titulo">Clasificación</h2>
            <span class="seccion__nota">Desempate: puntos → diferencia de goles → goles a favor</span>
          </div>
          ${tablaClasificacion(clasificacion)}
        </section>

        <div class="dos-columnas">
          <section class="seccion">
            <div class="seccion__cabecera">
              <h2 class="seccion__titulo">Última jornada</h2>
              <a class="seccion__nota" href="#/calendario">Ver calendario completo →</a>
            </div>
            <div class="tarjeta">
              ${
                ultimos.length
                  ? ultimos.map((p) => filaPartido(p, indiceEquipos)).join('')
                  : bloqueVacio('⚽', 'El campeonato todavía no ha empezado.')
              }
            </div>
          </section>

          <section class="seccion">
            <div class="seccion__cabecera">
              <h2 class="seccion__titulo">Próximos partidos</h2>
            </div>
            <div class="tarjeta">
              ${
                proximos.length
                  ? proximos.map((p) => filaPartido(p, indiceEquipos)).join('')
                  : bloqueVacio('🏁', 'No quedan partidos por disputar.')
              }
            </div>
          </section>
        </div>
      </div>
    </main>`;

  return { html };
}

/* ──────────────────────── componentes reutilizables ────────────────────── */

function tablaClasificacion(clasificacion) {
  if (!clasificacion.length) {
    return `<div class="tarjeta"><div class="vacio">
      <div class="vacio__icono">📋</div>
      <p><strong>Todavía no hay equipos en esta competición.</strong></p>
      <p class="seccion__nota" style="max-width:44ch;margin:8px auto 0">
        En cuanto los clubes se inscriban y se dispute la primera jornada, aquí saldrá
        la tabla con puntos, diferencia de goles y la racha de cada equipo.
      </p>
    </div></div>`;
  }

  const filas = clasificacion
    .map((f) => {
      const dif = f.diferencia;
      const claseDif = dif > 0 ? 'dif--pos' : dif < 0 ? 'dif--neg' : 'tenue';
      const racha = f.racha.length
        ? `<span class="racha">${f.racha
            .map((r) => `<span class="racha__item racha__item--${r}" title="${r === 'G' ? 'Ganado' : r === 'E' ? 'Empatado' : 'Perdido'}">${r}</span>`)
            .join('')}</span>`
        : '<span class="tenue">—</span>';

      return `
        <tr>
          <td><span class="pos pos--${f.posicion <= 3 ? f.posicion : 'n'}">${f.posicion}</span></td>
          <td class="izq">${enlaceEquipo(
            f.equipo,
            `${escudo(f.equipo)}<span class="celda-equipo__nombre">${escapar(f.equipo.nombre)}</span>`
          )}</td>
          <td>${f.jugados}</td>
          <td>${f.ganados}</td>
          <td>${f.empatados}</td>
          <td>${f.perdidos}</td>
          <td class="tenue">${f.golesFavor}</td>
          <td class="tenue">${f.golesContra}</td>
          <td class="${claseDif}">${dif > 0 ? '+' : ''}${dif}</td>
          <td class="destacado">${f.puntos}</td>
          <td class="izq">${racha}</td>
        </tr>`;
    })
    .join('');

  return `
    <div class="tarjeta">
      <div class="tabla-scroll">
        <table class="tabla">
          <thead>
            <tr>
              <th><span class="solo-lectores">Posición</span>#</th>
              <th class="izq">Equipo</th>
              <th title="Partidos jugados">PJ</th>
              <th title="Ganados">G</th>
              <th title="Empatados">E</th>
              <th title="Perdidos">P</th>
              <th title="Goles a favor">GF</th>
              <th title="Goles en contra">GC</th>
              <th title="Diferencia de goles">DIF</th>
              <th title="Puntos">PTS</th>
              <th class="izq">Racha</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>
      </div>
    </div>`;
}

function filaPartido(partido, indiceEquipos, opciones = {}) {
  const local = indiceEquipos.get(partido.localId);
  const visitante = indiceEquipos.get(partido.visitanteId);
  if (!local || !visitante) return '';

  const jugado = partido.estado === 'jugado';
  const marcador = jugado
    ? `<span class="partido__marcador">${partido.golesLocal} – ${partido.golesVisitante}</span>`
    : `<span class="partido__marcador partido__marcador--pendiente">${escapar(partido.hora || 'Por definir')}</span>`;

  let goleadores = '';
  if (jugado && opciones.conGoleadores && partido.goleadores?.length) {
    const items = [...partido.goleadores]
      .sort((a, b) => a.minuto - b.minuto)
      .map((g) => {
        const j = Datos.getJugador(g.jugadorId);
        return j ? `<span>⚽ ${escapar(nombreJugador(j))} ${g.minuto}'</span>` : '';
      })
      .filter(Boolean)
      .join('');
    if (items) goleadores = `<div class="partido__goleadores">${items}</div>`;
  }

  return `
    <div class="partido">
      <a class="partido__equipo" href="#/equipo/${escapar(local.id)}">
        ${escudo(local)}<span class="partido__nombre">${escapar(local.nombre)}</span>
      </a>
      ${marcador}
      <a class="partido__equipo partido__equipo--visitante" href="#/equipo/${escapar(visitante.id)}">
        ${escudo(visitante)}<span class="partido__nombre">${escapar(visitante.nombre)}</span>
      </a>
      ${goleadores}
    </div>`;
}

/* ─────────────────────────── vista: calendario ─────────────────────────── */

export function vistaCalendario(params = {}) {
  const { partidos, indiceEquipos } = contexto();
  const jornadas = agruparPorJornada(partidos);
  if (!jornadas.length) {
    return {
      html: `<main class="principal"><div class="contenedor">
        <section class="seccion">
          <div class="seccion__cabecera">
            <h1 class="seccion__titulo">Calendario</h1>
          </div>
          <div class="tarjeta"><div class="vacio">
            <div class="vacio__icono">📅</div>
            <p><strong>Todavía no hay partidos programados.</strong></p>
            <p class="seccion__nota" style="max-width:44ch;margin:8px auto 0">
              Cuando se cierre el plazo de inscripción y estén los equipos, aquí aparecerá
              el calendario por jornadas con la fecha, la hora y el marcador de cada partido.
            </p>
          </div></div>
        </section>
      </div></main>`,
    };
  }

  const actual = Number(params.jornada) || Datos.jornadaActual() || 1;
  const seleccionada = jornadas.find((j) => j.jornada === actual) || jornadas[0];

  const selector = jornadas
    .map(
      (j) =>
        `<a class="selector-jornadas__item ${j.jornada === seleccionada.jornada ? 'activo' : ''}" ` +
        `href="#/calendario/${j.jornada}">J${j.jornada}</a>`
    )
    .join('');

  const html = `
    <main class="principal">
      <div class="contenedor">
        <section class="seccion">
          <div class="seccion__cabecera">
            <h1 class="seccion__titulo">Calendario y resultados</h1>
            <span class="seccion__nota">${jornadas.length} jornadas · ${partidos.length} partidos</span>
          </div>
          <div class="selector-jornadas" style="margin-bottom:16px">${selector}</div>

          <div class="jornada">
            <div class="jornada__cabecera">
              <span class="jornada__titulo">Jornada ${seleccionada.jornada}</span>
              <span class="jornada__fecha">${formatearFecha(seleccionada.fecha)}</span>
              <span class="etiqueta ${seleccionada.jugada ? 'etiqueta--jugada' : 'etiqueta--pendiente'}">
                ${seleccionada.jugada ? 'Disputada' : 'Pendiente'}
              </span>
            </div>
            <div class="tarjeta">
              ${seleccionada.partidos
                .map((p) => filaPartido(p, indiceEquipos, { conGoleadores: true }))
                .join('')}
            </div>
          </div>
        </section>
      </div>
    </main>`;

  return { html };
}

/* ──────────────────────────── vista: equipos ───────────────────────────── */

export function vistaEquipos() {
  const { clasificacion } = contexto();

  const tarjetas = clasificacion
    .map((f) => {
      const e = f.equipo;
      const color = colorSeguro(e.colorPrimario);
      return `
        <a class="tarjeta-equipo" href="#/equipo/${escapar(e.id)}" style="--franja:${color}">
          <div class="tarjeta-equipo__fila">
            ${escudo(e, 'escudo--grande')}
            <div>
              <div class="tarjeta-equipo__nombre">${escapar(e.nombre)}</div>
              <div class="tarjeta-equipo__meta">${escapar(e.estadio)} · desde ${escapar(e.fundacion)}</div>
            </div>
          </div>
          <div class="tarjeta-equipo__stats">
            <div class="mini-stat">
              <div class="mini-stat__valor">${f.posicion}º</div>
              <div class="mini-stat__etiqueta">Puesto</div>
            </div>
            <div class="mini-stat">
              <div class="mini-stat__valor">${f.puntos}</div>
              <div class="mini-stat__etiqueta">Puntos</div>
            </div>
            <div class="mini-stat">
              <div class="mini-stat__valor">${f.golesFavor}</div>
              <div class="mini-stat__etiqueta">Goles</div>
            </div>
          </div>
        </a>`;
    })
    .join('');

  const html = `
    <main class="principal">
      <div class="contenedor">
        <section class="seccion">
          <div class="seccion__cabecera">
            <h1 class="seccion__titulo">Clubes</h1>
            <span class="seccion__nota">${
              clasificacion.length
                ? `${clasificacion.length} clubes · ordenados por clasificación`
                : 'aún sin registrar'
            }</span>
          </div>
          ${
            tarjetas
              ? `<div class="grid-equipos">${tarjetas}</div>`
              : `<div class="tarjeta"><div class="vacio">
                   <div class="vacio__icono">🏟️</div>
                   <p><strong>Todavía no hay clubes registrados.</strong></p>
                   <p class="seccion__nota" style="max-width:44ch;margin:8px auto 0">
                     La organización del torneo registra cada club y le entrega su acceso
                     para que cargue la nómina de sus jugadores.
                   </p>
                 </div></div>`
          }
        </section>
      </div>
    </main>`;

  return { html };
}

/* ─────────────────────── vista: ficha de un equipo ─────────────────────── */

export function vistaEquipo(params = {}) {
  const { clasificacion, partidos, jugadores, indiceEquipos } = contexto();
  const equipo = Datos.getEquipo(params.id);

  if (!equipo) {
    return {
      html: `<main class="principal"><div class="contenedor">
        <a class="volver" href="#/equipos">← Volver a equipos</a>
        ${bloqueVacio('🔍', 'No encontramos ese equipo.')}
      </div></main>`,
    };
  }

  const stats = estadisticasEquipo(equipo.id, clasificacion, partidos, jugadores);
  const f = stats.fila;
  const color = colorSeguro(equipo.colorPrimario);

  const plantilla = stats.plantilla
    .map(
      (j) => `
      <tr>
        <td class="tenue">${j.dorsal}</td>
        <td class="izq">${escapar(nombreJugador(j))}</td>
        <td class="izq tenue">${escapar(j.posicion)}</td>
        <td class="tenue">${j.edad}</td>
        <td class="${j.goles ? 'destacado' : 'tenue'}">${j.goles}</td>
      </tr>`
    )
    .join('');

  const html = `
    <main class="principal">
      <div class="contenedor">
        <a class="volver" href="#/equipos">← Volver a equipos</a>

        <div class="ficha">
          ${escudo(equipo, 'escudo--grande')}
          <div>
            <h1 class="ficha__nombre">${escapar(equipo.nombre)}</h1>
            <p class="ficha__meta">${escapar(equipo.estadio)} · Fundado en ${escapar(equipo.fundacion)}</p>
          </div>
        </div>

        <div class="hero__stats" style="margin-bottom:26px">
          <div class="stat"><div class="stat__valor">${f ? f.posicion + 'º' : '—'}</div><div class="stat__etiqueta">Clasificación</div></div>
          <div class="stat"><div class="stat__valor">${f ? f.puntos : 0}</div><div class="stat__etiqueta">Puntos</div></div>
          <div class="stat"><div class="stat__valor">${f ? `${f.ganados}-${f.empatados}-${f.perdidos}` : '—'}</div><div class="stat__etiqueta">G · E · P</div></div>
          <div class="stat"><div class="stat__valor">${f ? f.golesFavor : 0}<span class="tenue" style="font-size:.9rem">:${f ? f.golesContra : 0}</span></div><div class="stat__etiqueta">Goles</div></div>
        </div>

        <div class="dos-columnas">
          <section class="seccion">
            <div class="seccion__cabecera"><h2 class="seccion__titulo">Plantilla</h2>
              <span class="seccion__nota">${stats.plantilla.length} jugadores</span>
            </div>
            <div class="tarjeta">
              <div class="tabla-scroll">
                <table class="tabla" style="min-width:420px">
                  <thead><tr>
                    <th>Nº</th><th class="izq">Jugador</th><th class="izq">Posición</th><th>Edad</th><th>Goles</th>
                  </tr></thead>
                  <tbody>${plantilla}</tbody>
                </table>
              </div>
            </div>
          </section>

          <section class="seccion">
            <div class="seccion__cabecera"><h2 class="seccion__titulo">Partidos</h2></div>
            <div class="tarjeta">
              ${stats.partidos.map((p) => filaPartido(p, indiceEquipos)).join('')}
            </div>
          </section>
        </div>
      </div>
    </main>`;

  return { html };
}

/* ─────────────────────────── vista: goleadores ─────────────────────────── */

export function vistaGoleadores() {
  const { equipos, partidos, jugadores } = contexto();
  const lista = calcularGoleadores(jugadores, equipos, partidos);

  if (!lista.length) {
    return {
      html: `<main class="principal"><div class="contenedor">
        <section class="seccion"><div class="seccion__cabecera"><h1 class="seccion__titulo">Goleadores</h1></div>
        ${bloqueVacio('⚽', 'Todavía no se ha marcado ningún gol.')}</section>
      </div></main>`,
    };
  }

  const maximo = lista[0].goles;
  const filas = lista
    .map((item) => {
      const ancho = Math.max(6, Math.round((item.goles / maximo) * 100));
      return `
        <tr>
          <td><span class="medalla medalla--${item.posicion <= 3 ? item.posicion : 'n'}">${item.posicion}</span></td>
          <td class="izq">${escapar(nombreJugador(item.jugador))}</td>
          <td class="izq">${
            item.equipo
              ? enlaceEquipo(
                  item.equipo,
                  `${escudo(item.equipo, 'escudo--mini')}<span class="celda-equipo__nombre" style="font-weight:500">${escapar(item.equipo.nombre)}</span>`
                )
              : '<span class="tenue">—</span>'
          }</td>
          <td class="izq tenue">${escapar(item.jugador.posicion)}</td>
          <td class="destacado">${item.goles}</td>
          <td class="izq" style="width:130px"><span class="barra-goles" style="width:${ancho}%"></span></td>
        </tr>`;
    })
    .join('');

  const html = `
    <main class="principal">
      <div class="contenedor">
        <section class="seccion">
          <div class="seccion__cabecera">
            <h1 class="seccion__titulo">Goleadores</h1>
            <span class="seccion__nota">${lista.length} jugadores han marcado</span>
          </div>
          <div class="tarjeta">
            <div class="tabla-scroll">
              <table class="tabla">
                <thead><tr>
                  <th>#</th><th class="izq">Jugador</th><th class="izq">Equipo</th>
                  <th class="izq">Posición</th><th>Goles</th><th class="izq"></th>
                </tr></thead>
                <tbody>${filas}</tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>`;

  return { html };
}
