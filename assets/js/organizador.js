/**
 * PANEL DEL ORGANIZADOR — crear torneos y categorías, fijar la fecha límite
 * de inscripción y revisar qué clubes se han inscrito.
 *
 *   #/organizador                  → torneos, categorías y plazos
 *   #/organizador/:categoriaId     → inscritos de esa categoría
 *
 * Igual que el portal del dirigente, las reglas viven en data.js.
 */

import { Datos } from './data.js';
import { escapar, escudo, formatearFecha, nombreJugador } from './ui.js';

/** Hoy en formato YYYY-MM-DD, para el mínimo de los campos de fecha. */
function hoyIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function resumenCategoria(categoria) {
  const inscripciones = Datos.getInscripciones({ categoriaId: categoria.id });
  const jugadores = inscripciones.reduce(
    (suma, i) => suma + Datos.getJugadoresDeInscripcion(i.id).length,
    0
  );
  return {
    inscripciones,
    clubes: inscripciones.length,
    jugadores,
    pendientes: inscripciones.filter((i) => i.estado === 'borrador').length,
  };
}

/* ─────────────────────── vista principal del panel ─────────────────────── */

function vistaGeneral() {
  const torneos = Datos.getTorneos();

  const totalClubes = Datos.getClubes().length;
  const totalInscripciones = Datos.getInscripciones().length;
  const abiertas = Datos.getCategorias().filter(
    (c) => Datos.plazoAbierto(c).abierto
  ).length;

  const bloques = torneos
    .map((t) => {
      const filas = t.categorias
        .map((cat) => {
          const plazo = Datos.plazoAbierto(cat);
          const r = resumenCategoria(cat);
          const pronto = plazo.abierto && plazo.dias <= 7;

          const etiqueta = !plazo.abierto
            ? '<span class="etiqueta etiqueta--cerrada">Cerrada</span>'
            : pronto
            ? '<span class="etiqueta etiqueta--pronto">Cierra pronto</span>'
            : '<span class="etiqueta etiqueta--abierta">Abierta</span>';

          return `
            <div class="categoria">
              <span class="categoria__marca" style="--marca:${
                plazo.abierto ? 'var(--neon)' : 'var(--error)'
              }"></span>
              <div class="categoria__datos">
                <span class="categoria__nombre">${escapar(cat.nombre)}</span>
                <span class="categoria__meta">${r.clubes} club${r.clubes === 1 ? '' : 'es'} ·
                  ${r.jugadores} jugador${r.jugadores === 1 ? '' : 'es'} ·
                  cierra el ${formatearFecha(cat.fechaLimite, { day: 'numeric', month: 'long' })}</span>
              </div>
              <div class="categoria__acciones">
                ${etiqueta}
                <input class="entrada js-fecha" type="date" value="${escapar(cat.fechaLimite)}"
                       data-categoria="${escapar(cat.id)}"
                       aria-label="Fecha límite de ${escapar(cat.nombre)}"
                       style="width:auto;font-size:.8rem;padding:6px 9px">
                <a class="boton boton--secundario boton--chico"
                   href="#/organizador/${escapar(cat.id)}">Ver inscritos</a>
              </div>
            </div>`;
        })
        .join('');

      return `
        <div class="torneo">
          <div class="torneo__cabecera">
            <span class="torneo__nombre">${escapar(t.nombre)}</span>
            <span class="torneo__modalidad">${escapar(t.modalidad)}</span>
            <span class="seccion__nota" style="margin-left:auto">${t.categorias.length} categorías</span>
          </div>
          ${filas || '<div class="vacio"><p>Sin categorías todavía. Créalas abajo.</p></div>'}
          <div style="padding:12px 16px;border-top:1px solid var(--borde-suave)">
            <details>
              <summary style="cursor:pointer;font-size:.82rem;font-weight:700;color:var(--neon)">
                + Añadir categoría a ${escapar(t.nombre)}
              </summary>
              <div class="rejilla-campos" style="margin-top:12px">
                <div class="campo">
                  <label class="campo__etiqueta">Nombre</label>
                  <input class="entrada js-cat-nombre" maxlength="20" placeholder="Sub-14">
                </div>
                <div class="campo">
                  <label class="campo__etiqueta">Fecha límite</label>
                  <input class="entrada js-cat-fecha" type="date" min="${hoyIso()}">
                </div>
                <div class="campo">
                  <label class="campo__etiqueta">Edad mínima</label>
                  <input class="entrada js-cat-min" type="number" min="4" max="80" placeholder="opcional">
                </div>
                <div class="campo">
                  <label class="campo__etiqueta">Edad máxima</label>
                  <input class="entrada js-cat-max" type="number" min="4" max="80" placeholder="14">
                </div>
                <div class="campo">
                  <label class="campo__etiqueta">Máx. jugadores</label>
                  <input class="entrada js-cat-cupo" type="number" min="5" max="40" value="18">
                </div>
                <div class="campo" style="justify-content:flex-end">
                  <button class="boton js-crear-cat" data-torneo="${escapar(t.id)}">Crear categoría</button>
                </div>
              </div>
              <div class="js-msj-cat"></div>
            </details>
          </div>
        </div>`;
    })
    .join('');

  const html = `
    <main class="principal"><div class="contenedor">
      <section class="seccion">
        <div class="seccion__cabecera">
          <h1 class="seccion__titulo">Panel del organizador</h1>
          <span class="seccion__nota">Tú defines los torneos, las categorías y hasta cuándo se puede inscribir</span>
        </div>

        <div class="hero__stats" style="margin-bottom:22px">
          <div class="stat"><div class="stat__valor">${torneos.length}</div><div class="stat__etiqueta">Torneos</div></div>
          <div class="stat"><div class="stat__valor">${abiertas}</div><div class="stat__etiqueta">Plazos abiertos</div></div>
          <div class="stat"><div class="stat__valor">${totalClubes}</div><div class="stat__etiqueta">Clubes</div></div>
          <div class="stat"><div class="stat__valor">${totalInscripciones}</div><div class="stat__etiqueta">Inscripciones</div></div>
        </div>

        <div class="aviso aviso--info">
          <span class="aviso__icono">✏️</span>
          <div>Puedes cambiar cualquier <strong>fecha límite</strong> ahí mismo: al tocarla se
          guarda sola y el portal del dirigente se cierra o se reabre al instante.</div>
        </div>

        <div class="grid-torneos">${bloques}</div>
      </section>

      <section class="seccion">
        <div class="seccion__cabecera"><h2 class="seccion__titulo">Crear un torneo nuevo</h2></div>
        <div class="tarjeta"><div class="tarjeta__cuerpo">
          <div class="rejilla-campos rejilla-campos--tres">
            <div class="campo">
              <label class="campo__etiqueta" for="t-nombre">Nombre del torneo</label>
              <input class="entrada" id="t-nombre" maxlength="40" placeholder="Copa Fugaz Fútbol 7">
            </div>
            <div class="campo">
              <label class="campo__etiqueta" for="t-modalidad">Modalidad</label>
              <select class="selector" id="t-modalidad">
                <option>Fútbol 7</option><option>Fútbol 11</option>
                <option>Fútbol sala</option><option>Fútbol 8</option>
              </select>
            </div>
            <div class="campo">
              <label class="campo__etiqueta" for="t-jugadores">Jugadores en cancha</label>
              <input class="entrada" id="t-jugadores" type="number" min="5" max="11" value="7">
            </div>
          </div>
          <div id="msj-torneo"></div>
          <div class="acciones">
            <button class="boton boton--ancho" id="btn-crear-torneo">Crear torneo</button>
            <button class="boton boton--peligro" id="btn-restaurar" style="margin-left:auto"
              ${Datos.hayCambiosLocales() ? '' : 'disabled'}>Descartar todos mis cambios</button>
          </div>
        </div></div>
      </section>
    </div></main>`;

  function activar(raiz, navegar) {
    const $ = (s) => raiz.querySelector(s);

    const avisar = (nodo, texto, tipo) => {
      nodo.innerHTML = texto
        ? `<div class="aviso aviso--${tipo}" style="margin:12px 0 0">
             <span class="aviso__icono">${tipo === 'error' ? '⚠️' : '✅'}</span>
             <div>${escapar(texto)}</div></div>`
        : '';
    };

    // Cambiar la fecha límite de una categoría existente.
    raiz.addEventListener('change', async (e) => {
      const campo = e.target.closest('.js-fecha');
      if (!campo) return;
      await Datos.actualizarCategoria(campo.dataset.categoria, {
        fechaLimite: campo.value,
      });
      navegar('#/organizador', true);
    });

    // Crear categoría dentro de un torneo.
    raiz.addEventListener('click', async (e) => {
      const boton = e.target.closest('.js-crear-cat');
      if (!boton) return;
      const caja = boton.closest('details');
      const valor = (clase) => caja.querySelector(clase).value;

      const res = await Datos.crearCategoria(boton.dataset.torneo, {
        nombre: valor('.js-cat-nombre'),
        fechaLimite: valor('.js-cat-fecha'),
        edadMinima: valor('.js-cat-min'),
        edadMaxima: valor('.js-cat-max'),
        maxJugadores: valor('.js-cat-cupo'),
      });
      if (!res.ok) return avisar(caja.querySelector('.js-msj-cat'), res.motivo, 'error');
      navegar('#/organizador', true);
    });

    $('#btn-crear-torneo').addEventListener('click', async () => {
      const res = await Datos.crearTorneo({
        nombre: $('#t-nombre').value,
        modalidad: $('#t-modalidad').value,
        jugadoresPorEquipo: $('#t-jugadores').value,
      });
      if (!res.ok) return avisar($('#msj-torneo'), res.motivo, 'error');
      navegar('#/organizador', true);
    });

    $('#btn-restaurar').addEventListener('click', async () => {
      if (!confirm('Se descartarán todos los torneos, clubes e inscripciones que hayas creado. ¿Continuar?')) return;
      await Datos.restaurarOriginales();
      navegar('#/organizador', true);
    });
  }

  return { html, activar };
}

/* ────────────────────── inscritos de una categoría ─────────────────────── */

function vistaInscritos(categoria) {
  const plazo = Datos.plazoAbierto(categoria);
  const inscripciones = Datos.getInscripciones({ categoriaId: categoria.id });

  const tarjetas = inscripciones.length
    ? inscripciones
        .map((i) => {
          const club = Datos.getClub(i.clubId);
          if (!club) return '';
          const jugadores = Datos.getJugadoresDeInscripcion(i.id);
          const minimo = categoria.torneo.jugadoresPorEquipo;
          const completo = jugadores.length >= minimo;

          const filas = jugadores.length
            ? jugadores
                .map(
                  (j) => `
              <div class="nomina-fila">
                <span class="nomina-dorsal">${j.dorsal}</span>
                <div class="nomina-datos">
                  <div class="nomina-nombre">${escapar(nombreJugador(j))}</div>
                  <div class="nomina-meta">${j.edad} años · CI ${escapar(j.cedula)} · ${escapar(j.posicion)}</div>
                </div>
              </div>`
                )
                .join('')
            : '<div class="vacio"><p>Este club todavía no ha cargado jugadores.</p></div>';

          return `
            <div class="tarjeta" style="margin-bottom:14px">
              <div class="torneo__cabecera">
                ${escudo(club)}
                <div style="min-width:0">
                  <div class="tarjeta-equipo__nombre">${escapar(club.nombre)}</div>
                  <div class="tarjeta-equipo__meta">Dirigente: ${escapar(club.dirigente?.nombre || '—')}
                    ${club.dirigente?.telefono ? ' · ' + escapar(club.dirigente.telefono) : ''}</div>
                </div>
                <span class="etiqueta etiqueta--${escapar(i.estado)} etiqueta--auto">${escapar(i.estado)}</span>
              </div>
              <div style="padding:10px 14px;border-bottom:1px solid var(--borde-suave)">
                <span class="seccion__nota">
                  ${jugadores.length} de ${categoria.maxJugadores} jugadores ·
                  ${completo ? 'cumple el mínimo' : `le faltan ${minimo - jugadores.length} para el mínimo`}
                </span>
                <div class="medidor" style="margin-top:7px">
                  <div class="medidor__relleno ${completo ? 'medidor__relleno--lleno' : ''}"
                       style="width:${Math.min(100, Math.round((jugadores.length / categoria.maxJugadores) * 100))}%"></div>
                </div>
              </div>
              <details>
                <summary style="cursor:pointer;padding:11px 14px;font-size:.82rem;font-weight:700;color:var(--neon)">
                  Ver nómina completa
                </summary>
                ${filas}
              </details>
            </div>`;
        })
        .join('')
    : '<div class="tarjeta"><div class="vacio"><div class="vacio__icono">📭</div><p>Ningún club se ha inscrito todavía en esta categoría.</p></div></div>';

  const html = `
    <main class="principal"><div class="contenedor">
      <a class="volver" href="#/organizador">← Volver al panel</a>

      <div class="ficha">
        <div>
          <h1 class="ficha__nombre">${escapar(categoria.torneo.nombre)} · ${escapar(categoria.nombre)}</h1>
          <p class="ficha__meta">
            ${plazo.abierto
              ? `Plazo abierto hasta el ${formatearFecha(categoria.fechaLimite)}`
              : `Plazo cerrado el ${formatearFecha(categoria.fechaLimite)}`}
          </p>
        </div>
        <span class="etiqueta etiqueta--${plazo.abierto ? 'abierta' : 'cerrada'}" style="margin-left:auto">
          ${plazo.abierto ? 'Abierta' : 'Cerrada'}
        </span>
      </div>

      <section class="seccion">
        <div class="seccion__cabecera">
          <h2 class="seccion__titulo">Clubes inscritos</h2>
          <span class="seccion__nota">${inscripciones.length} inscripciones</span>
        </div>
        ${tarjetas}
      </section>
    </div></main>`;

  return { html };
}

/* ─────────────────────────────── entrada ───────────────────────────────── */

export function vistaOrganizador(params = {}) {
  if (!params.categoriaId) return vistaGeneral();
  const categoria = Datos.getCategoria(params.categoriaId);
  if (!categoria) return vistaGeneral();
  return vistaInscritos(categoria);
}
