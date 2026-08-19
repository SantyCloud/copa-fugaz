/**
 * PORTAL DEL DIRIGENTE — inscribir el club y cargar su nómina.
 *
 * Una decisión por pantalla, para que nadie se pierda:
 *   #/inscripcion                        → ¿en qué torneo juegas?
 *   #/inscripcion/:torneoId              → ¿en qué categoría?
 *   #/inscripcion/:torneoId/:categoriaId → cargar los jugadores
 *
 * Antes se enseñaban los dos torneos con sus veinte categorías a la vez, todas
 * con el mismo texto repetido. Ahora son dos preguntas cortas y claras.
 *
 * Las reglas (fecha límite, edad, cédula repetida, cupo) NO se comprueban
 * aquí: viven en data.js. Esta vista solo enseña el resultado.
 */

import { Datos } from './data.js';
import { Sesion } from './sesion.js';
import { escapar, escudo, formatearFecha } from './ui.js';
import { Iconos } from './iconos.js';

/** Barra de pasos. El dirigente siempre ve los mismos tres. */
function barraPasos(paso) {
  const pasos = ['Torneo', 'Categoría', 'Jugadores'];
  return `
    <div class="pasos">
      ${pasos
        .map((nombre, i) => {
          const n = i + 1;
          const clase = n === paso ? 'paso--activo' : n < paso ? 'paso--hecho' : '';
          return `<div class="paso ${clase}">
            <span class="paso__numero">${n < paso ? '✓' : n}</span>${escapar(nombre)}
          </div>`;
        })
        .join('')}
    </div>`;
}

/** Cabecera con el escudo y el nombre del club. */
function cabeceraClub(club, sub) {
  return `
    <div class="ficha">
      ${escudo(club, 'escudo--grande')}
      <div>
        <h1 class="ficha__nombre">${escapar(club.nombre)}</h1>
        <p class="ficha__meta">${sub}</p>
      </div>
    </div>`;
}

/* ─────────────────── paso 1: ¿en qué torneo juegas? ────────────────────── */

function pasoTorneo(club) {
  const torneos = Datos.getTorneos();

  const tarjetas = torneos
    .map((t) => {
      const abiertas = t.categorias.filter((c) => Datos.plazoAbierto(c).abierto).length;
      const yaInscrito = Datos.getInscripciones({ clubId: club.id, torneoId: t.id }).length;

      return `
        <a class="eleccion" href="#/inscripcion/${escapar(t.id)}">
          <span class="eleccion__icono">${Iconos.trofeo(26)}</span>
          <span class="eleccion__titulo">${escapar(t.nombre)}</span>
          <span class="eleccion__texto">${t.jugadoresPorEquipo} jugadores por equipo</span>
          <span class="eleccion__pie">
            ${abiertas} categoría${abiertas === 1 ? '' : 's'} abierta${abiertas === 1 ? '' : 's'}
            ${yaInscrito ? ` · ya estás en ${yaInscrito}` : ''}
          </span>
        </a>`;
    })
    .join('');

  const html = `
    <main class="principal"><div class="contenedor contenedor--medio">
      ${barraPasos(1)}
      ${cabeceraClub(club, `Dirigente: ${escapar(club.dirigente?.nombre || '—')}`)}

      <h2 class="pregunta-grande">¿En qué torneo juega tu equipo?</h2>
      <div class="elecciones">${tarjetas}</div>
    </div></main>`;

  return { html };
}

/* ───────────────── paso 2: ¿en qué categoría? ──────────────────────────── */

function pasoCategoria(club, torneo) {
  const fichas = torneo.categorias
    .map((c) => {
      const plazo = Datos.plazoAbierto(c);
      const inscripcion = Datos.getInscripciones({ clubId: club.id, categoriaId: c.id })[0];
      const pronto = plazo.abierto && plazo.dias <= 7;

      const nombresEstado = {
        borrador: 'Empezada',
        enviada: 'Enviada',
        aprobada: 'Aprobada',
      };

      const pie = inscripcion
        ? `<span class="cat-ficha__estado cat-ficha__estado--${escapar(inscripcion.estado)}">${
            escapar(nombresEstado[inscripcion.estado] || inscripcion.estado)
          }</span>`
        : !plazo.abierto
        ? '<span class="cat-ficha__estado">Plazo cerrado</span>'
        : pronto
        ? `<span class="cat-ficha__estado cat-ficha__estado--pronto">Quedan ${plazo.dias} d${plazo.dias === 1 ? 'ía' : 'ías'}</span>`
        : '<span class="cat-ficha__estado cat-ficha__estado--libre">Abierta</span>';

      const clase = !plazo.abierto && !inscripcion ? 'cat-ficha--cerrada' : '';
      const edad =
        c.edadMaxima != null ? `hasta ${c.edadMaxima} años` : 'mayores de 18';

      const cuerpo = `
        <span class="cat-ficha__nombre">${escapar(c.nombre)}</span>
        <span class="cat-ficha__edad">${escapar(edad)}</span>
        ${pie}`;

      return plazo.abierto || inscripcion
        ? `<a class="cat-ficha ${clase}" href="#/inscripcion/${escapar(torneo.id)}/${escapar(c.id)}">${cuerpo}</a>`
        : `<span class="cat-ficha ${clase}">${cuerpo}</span>`;
    })
    .join('');

  const html = `
    <main class="principal"><div class="contenedor contenedor--medio">
      <a class="volver" href="#/inscripcion">← Cambiar de torneo</a>
      ${barraPasos(2)}
      ${cabeceraClub(club, escapar(torneo.nombre))}

      <h2 class="pregunta-grande">¿En qué categoría?</h2>
      <p class="pregunta-ayuda">Puedes inscribir a tu club en varias. Elige una para empezar.</p>
      <div class="cat-rejilla">${fichas}</div>
    </div></main>`;

  return { html };
}

function pasoNomina(club, categoria, inscripcion) {
  const plazo = Datos.plazoAbierto(categoria);
  const jugadores = Datos.getJugadoresDeInscripcion(inscripcion.id);
  const minimo = categoria.torneo.jugadoresPorEquipo;
  const maximo = categoria.maxJugadores;
  const porcentaje = Math.min(100, Math.round((jugadores.length / maximo) * 100));
  const bloqueado = !plazo.abierto;

  const filas = jugadores.length
    ? jugadores
        .map(
          (j) => `
        <div class="nomina-fila">
          <span class="nomina-dorsal">${j.dorsal}</span>
          <div class="nomina-datos">
            <div class="nomina-nombre">${escapar(j.nombreCompleto || `${j.nombre} ${j.apellidos}`)}</div>
            <div class="nomina-meta">${j.edad} años · CI ${escapar(j.cedula)} · ${escapar(j.posicion)}</div>
          </div>
          ${
            bloqueado
              ? ''
              : `<button class="boton boton--secundario boton--chico js-quitar"
                    data-jugador="${j.id}" aria-label="Quitar a ${escapar(j.nombre)}">Quitar</button>`
          }
        </div>`
        )
        .join('')
    : '<div class="vacio"><div class="vacio__icono">👥</div><p>Todavía no has añadido ningún jugador.</p></div>';

  const avisoPlazo = bloqueado
    ? `<div class="aviso aviso--error">
         <span class="aviso__icono">🔒</span>
         <div><strong>Plazo cerrado.</strong> La inscripción de ${escapar(categoria.nombre)}
         terminó el ${formatearFecha(categoria.fechaLimite)}. La nómina ya no se puede modificar.</div>
       </div>`
    : plazo.dias <= 7
    ? `<div class="aviso aviso--alerta">
         <span class="aviso__icono">⏳</span>
         <div><strong>${plazo.dias <= 0 ? 'Hoy es el último día.' : `Quedan ${plazo.dias} día${plazo.dias === 1 ? '' : 's'}.`}</strong>
         El plazo cierra el ${formatearFecha(categoria.fechaLimite)}.</div>
       </div>`
    : `<div class="aviso aviso--info">
         <span class="aviso__icono">📅</span>
         <div>Puedes añadir jugadores hasta el <strong>${formatearFecha(categoria.fechaLimite)}</strong>
         (quedan ${plazo.dias} días).</div>
       </div>`;

  const formulario = bloqueado
    ? ''
    : `
    <section class="seccion">
      <div class="seccion__cabecera"><h2 class="seccion__titulo">Añadir jugador</h2></div>
      <div class="tarjeta"><div class="tarjeta__cuerpo">
        <div class="rejilla-campos">
          <div class="campo">
            <label class="campo__etiqueta" for="j-nombre">Nombre</label>
            <input class="entrada" id="j-nombre" maxlength="30" placeholder="Mateo">
          </div>
          <div class="campo">
            <label class="campo__etiqueta" for="j-apellidos">Apellidos</label>
            <input class="entrada" id="j-apellidos" maxlength="40" placeholder="Ortega Salas">
          </div>
          <div class="campo">
            <label class="campo__etiqueta" for="j-cedula">Número de cédula</label>
            <input class="entrada" id="j-cedula" inputmode="numeric" maxlength="12" placeholder="1712345678">
          </div>
          <div class="campo">
            <label class="campo__etiqueta" for="j-edad">Edad</label>
            <input class="entrada" id="j-edad" type="number" min="4" max="80"
                   placeholder="${categoria.edadMaxima ?? 25}">
            <span class="campo__ayuda">${
              categoria.edadMaxima != null
                ? `${escapar(categoria.nombre)} admite hasta ${categoria.edadMaxima} años`
                : 'Sin límite superior'
            }</span>
          </div>
          <div class="campo">
            <label class="campo__etiqueta" for="j-posicion">Posición</label>
            <select class="selector" id="j-posicion">
              <option>Portero</option><option>Defensa</option>
              <option>Centrocampista</option><option>Delantero</option>
            </select>
          </div>
          <div class="campo">
            <label class="campo__etiqueta" for="j-dorsal">Dorsal</label>
            <input class="entrada" id="j-dorsal" type="number" min="1" max="99" placeholder="automático">
          </div>
        </div>
        <div id="msj-jugador"></div>
        <div class="acciones">
          <button class="boton boton--ancho" id="btn-anadir">Añadir a la nómina</button>
        </div>
      </div></div>
    </section>`;

  const html = `
    <main class="principal"><div class="contenedor contenedor--medio">
      <a class="volver" href="#/inscripcion/${escapar(categoria.torneo.id)}">← Cambiar de categoría</a>
      ${barraPasos(3)}

      <div class="ficha">
        ${escudo(club, 'escudo--grande')}
        <div>
          <h1 class="ficha__nombre">${escapar(club.nombre)}</h1>
          <p class="ficha__meta">${escapar(categoria.torneo.nombre)} · ${escapar(categoria.nombre)}
            <span class="etiqueta etiqueta--${escapar(inscripcion.estado)}" style="margin-left:6px">${escapar(inscripcion.estado)}</span>
          </p>
        </div>
      </div>

      ${avisoPlazo}

      <section class="seccion">
        <div class="seccion__cabecera">
          <h2 class="seccion__titulo">Nómina</h2>
          <span class="seccion__nota">${jugadores.length} de ${maximo} · mínimo ${minimo} para competir</span>
        </div>
        <div class="tarjeta">
          ${filas}
          <div style="padding:12px 14px 14px">
            <div class="medidor">
              <div class="medidor__relleno ${jugadores.length >= minimo ? 'medidor__relleno--lleno' : ''}"
                   style="width:${porcentaje}%"></div>
            </div>
          </div>
        </div>
        <div id="msj-envio"></div>
        ${
          bloqueado
            ? ''
            : `<div class="acciones">
                 <button class="boton boton--ancho" id="btn-enviar"
                   ${inscripcion.estado === 'enviada' ? 'disabled' : ''}>
                   ${inscripcion.estado === 'enviada' ? 'Nómina ya enviada' : 'Enviar nómina al organizador'}
                 </button>
               </div>`
        }
      </section>

      ${formulario}
    </div></main>`;

  function activar(raiz, navegar) {
    const $ = (s) => raiz.querySelector(s);

    const avisar = (destino, texto, tipo) => {
      $(destino).innerHTML = texto
        ? `<div class="aviso aviso--${tipo}" style="margin:14px 0 0">
             <span class="aviso__icono">${tipo === 'error' ? '⚠️' : '✅'}</span>
             <div>${escapar(texto)}</div></div>`
        : '';
    };

    $('#btn-anadir')?.addEventListener('click', async () => {
      const res = await Datos.agregarJugador(inscripcion.id, {
        nombre: $('#j-nombre').value,
        apellidos: $('#j-apellidos').value,
        cedula: $('#j-cedula').value,
        edad: $('#j-edad').value,
        dorsal: $('#j-dorsal').value,
        posicion: $('#j-posicion').value,
      });
      if (!res.ok) return avisar('#msj-jugador', res.motivo, 'error');
      navegar(`#/inscripcion/${categoria.torneo.id}/${categoria.id}`, true);
    });

    raiz.addEventListener('click', async (e) => {
      const boton = e.target.closest('.js-quitar');
      if (!boton) return;
      const res = await Datos.quitarJugador(boton.dataset.jugador);
      if (!res.ok) return avisar('#msj-envio', res.motivo, 'error');
      navegar(`#/inscripcion/${categoria.torneo.id}/${categoria.id}`, true);
    });

    $('#btn-enviar')?.addEventListener('click', async () => {
      const res = await Datos.enviarInscripcion(inscripcion.id);
      if (!res.ok) return avisar('#msj-envio', res.motivo, 'error');
      navegar(`#/inscripcion/${categoria.torneo.id}/${categoria.id}`, true);
    });
  }

  return { html, activar };
}

/* ─────────────────────────────── entrada ───────────────────────────────── */

/**
 * El organizador no pasa por aquí: ve todas las nóminas desde su panel.
 * Así este flujo tiene un solo tipo de usuario y una sola ruta posible.
 */
function soloParaDirigentes() {
  return {
    html: `
      <main class="principal"><div class="contenedor contenedor--estrecho">
        <div class="aviso aviso--info">
          <span class="aviso__icono">📋</span>
          <div><strong>Las nóminas de los clubes están en tu panel.</strong>
          <p style="margin-top:6px">Entra en una categoría para ver quién se ha inscrito
          y qué jugadores ha cargado cada club.</p></div>
        </div>
        <div class="acciones" style="border:0">
          <a class="boton" href="#/organizador">Ir a mi panel</a>
        </div>
      </div></main>`,
  };
}

export function vistaInscripcion(params = {}) {
  if (Sesion.esOrganizador()) return soloParaDirigentes();

  const club = Datos.getClub(Sesion.clubDeLaSesion());
  if (!club) {
    return {
      html: `
        <main class="principal"><div class="contenedor contenedor--estrecho">
          <div class="aviso aviso--error">
            <span class="aviso__icono">⚠️</span>
            <div>No encontramos tu club. Vuelve a entrar.</div>
          </div>
          <div class="acciones" style="border:0">
            <a class="boton" href="#/entrar">Entrar</a>
          </div>
        </div></main>`,
    };
  }

  // Paso 1: sin torneo elegido.
  const torneo = params.torneoId ? Datos.getTorneo(params.torneoId) : null;
  if (!torneo) return pasoTorneo(club);

  // Paso 2: sin categoría elegida.
  if (!params.categoriaId) return pasoCategoria(club, torneo);

  const categoria = Datos.getCategoria(params.categoriaId);
  if (!categoria) return pasoCategoria(club, torneo);

  // Paso 3: nos aseguramos de que exista la inscripción antes de la nómina.
  let inscripcion = Datos.getInscripciones({
    clubId: club.id,
    categoriaId: categoria.id,
  })[0];

  if (!inscripcion) {
    // La creamos al vuelo: el dirigente ya dijo que quiere esta categoría.
    const plazo = Datos.plazoAbierto(categoria);
    if (!plazo.abierto) return pasoCategoria(club, torneo);
    Datos.crearInscripcion({ clubId: club.id, categoriaId: categoria.id });
    inscripcion = Datos.getInscripciones({
      clubId: club.id,
      categoriaId: categoria.id,
    })[0];
    if (!inscripcion) return pasoCategoria(club, torneo);
  }

  return pasoNomina(club, categoria, inscripcion);
}
