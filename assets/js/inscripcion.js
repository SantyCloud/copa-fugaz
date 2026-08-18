/**
 * PORTAL DEL DIRIGENTE — inscribir un club y cargar su nómina.
 *
 * Tres pasos, cada uno con su propia dirección para poder volver atrás:
 *   #/inscripcion                          → elegir o registrar el club
 *   #/inscripcion/:clubId                  → elegir torneo y categoría
 *   #/inscripcion/:clubId/:categoriaId     → cargar la nómina de jugadores
 *
 * Las reglas (fecha límite, edad, cédula repetida, cupo) NO se comprueban
 * aquí: viven en data.js, que es lo que se migrará a Supabase. Esta vista
 * solo enseña el resultado.
 */

import { Datos } from './data.js';
import { escapar, escudo, formatearFecha } from './ui.js';

function barraPasos(paso) {
  const pasos = ['Club', 'Torneo y categoría', 'Nómina'];
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

/** Etiqueta y cuenta atrás del plazo de una categoría. */
function estadoPlazo(categoria) {
  const { abierto, dias } = Datos.plazoAbierto(categoria);
  if (!abierto) {
    return {
      abierto: false,
      etiqueta: '<span class="etiqueta etiqueta--cerrada">Cerrada</span>',
      texto: `<span class="cuenta-atras cuenta-atras--cerrada">Cerró el ${formatearFecha(categoria.fechaLimite, { day: 'numeric', month: 'short' })}</span>`,
    };
  }
  const pronto = dias <= 7;
  return {
    abierto: true,
    etiqueta: `<span class="etiqueta etiqueta--${pronto ? 'pronto' : 'abierta'}">${pronto ? 'Cierra pronto' : 'Abierta'}</span>`,
    texto: `<span class="cuenta-atras ${pronto ? 'cuenta-atras--pronto' : ''}">${
      dias <= 0 ? 'Último día' : `Quedan ${dias} día${dias === 1 ? '' : 's'}`
    }</span>`,
  };
}

/* ───────────────────────── paso 1: elegir club ─────────────────────────── */

function pasoClub() {
  const clubes = Datos.getClubes();

  const lista = clubes
    .map((c) => {
      const inscripciones = Datos.getInscripciones({ clubId: c.id });
      return `
      <a class="tarjeta-equipo" href="#/inscripcion/${escapar(c.id)}"
         style="--franja:${escapar(c.colorPrimario)}">
        <div class="tarjeta-equipo__fila">
          ${escudo(c, 'escudo--grande')}
          <div style="min-width:0">
            <div class="tarjeta-equipo__nombre">${escapar(c.nombre)}</div>
            <div class="tarjeta-equipo__meta">Dirigente: ${escapar(c.dirigente?.nombre || '—')}</div>
          </div>
        </div>
        <div class="tarjeta-equipo__stats">
          <div class="mini-stat">
            <div class="mini-stat__valor">${inscripciones.length}</div>
            <div class="mini-stat__etiqueta">Inscripciones</div>
          </div>
        </div>
      </a>`;
    })
    .join('');

  const html = `
    <main class="principal"><div class="contenedor">
      ${barraPasos(1)}
      <section class="seccion">
        <div class="seccion__cabecera">
          <h1 class="seccion__titulo">¿Desde qué club te inscribes?</h1>
          <span class="seccion__nota">${clubes.length} clubes registrados</span>
        </div>
        <div class="grid-equipos">${lista}</div>
      </section>

      <section class="seccion">
        <div class="seccion__cabecera"><h2 class="seccion__titulo">¿Tu club no está?</h2></div>
        <div class="tarjeta">
          <div class="tarjeta__cuerpo">
            <div class="rejilla-campos">
              <div class="campo campo--ancho">
                <label class="campo__etiqueta" for="c-nombre">Nombre del club</label>
                <input class="entrada" id="c-nombre" maxlength="40" placeholder="Deportivo Los Álamos">
              </div>
              <div class="campo">
                <label class="campo__etiqueta" for="c-abrev">Siglas</label>
                <input class="entrada" id="c-abrev" maxlength="4" placeholder="DLA">
              </div>
              <div class="campo">
                <label class="campo__etiqueta" for="c-color">Color del club</label>
                <input class="entrada" id="c-color" type="color" value="#9ee641" style="height:44px;padding:5px">
              </div>
              <div class="campo campo--ancho">
                <label class="campo__etiqueta" for="c-dirigente">Dirigente responsable</label>
                <input class="entrada" id="c-dirigente" maxlength="60" placeholder="Nombre y apellidos">
              </div>
              <div class="campo">
                <label class="campo__etiqueta" for="c-telefono">Teléfono</label>
                <input class="entrada" id="c-telefono" maxlength="20" placeholder="0991234567">
              </div>
              <div class="campo">
                <label class="campo__etiqueta" for="c-correo">Correo</label>
                <input class="entrada" id="c-correo" type="email" maxlength="60" placeholder="club@correo.com">
              </div>
            </div>
            <div id="msj-club"></div>
            <div class="acciones">
              <button class="boton boton--ancho" id="btn-registrar">Registrar club</button>
            </div>
          </div>
        </div>
      </section>
    </div></main>`;

  function activar(raiz, navegar) {
    const $ = (s) => raiz.querySelector(s);
    $('#btn-registrar').addEventListener('click', async () => {
      const res = await Datos.registrarClub({
        nombre: $('#c-nombre').value,
        abreviatura: $('#c-abrev').value,
        colorPrimario: $('#c-color').value,
        dirigente: {
          nombre: $('#c-dirigente').value,
          telefono: $('#c-telefono').value,
          correo: $('#c-correo').value,
        },
      });
      if (!res.ok) {
        $('#msj-club').innerHTML =
          `<div class="aviso aviso--error" style="margin:14px 0 0">
             <span class="aviso__icono">⚠️</span><div>${escapar(res.motivo)}</div></div>`;
        return;
      }
      navegar(`#/inscripcion/${res.club.id}`);
    });
  }

  return { html, activar };
}

/* ──────────────────── paso 2: elegir torneo y categoría ────────────────── */

function pasoCategoria(club) {
  const torneos = Datos.getTorneos();

  const bloques = torneos
    .map((t) => {
      const filas = t.categorias
        .map((cat) => {
          const plazo = estadoPlazo(cat);
          const yaInscrito = Datos.getInscripciones({
            clubId: club.id,
            categoriaId: cat.id,
          })[0];

          const rango =
            cat.edadMaxima != null
              ? `hasta ${cat.edadMaxima} años`
              : cat.edadMinima != null
              ? `desde ${cat.edadMinima} años`
              : 'sin límite de edad';

          let accion;
          if (yaInscrito) {
            accion = `<a class="boton boton--secundario boton--chico"
                         href="#/inscripcion/${escapar(club.id)}/${escapar(cat.id)}">
                        Ver nómina</a>`;
          } else if (plazo.abierto) {
            accion = `<button class="boton boton--chico js-inscribir"
                         data-categoria="${escapar(cat.id)}">Inscribirse</button>`;
          } else {
            accion = `<button class="boton boton--chico" disabled>Plazo cerrado</button>`;
          }

          const estadoInsc = yaInscrito
            ? `<span class="etiqueta etiqueta--${escapar(yaInscrito.estado)}">${escapar(yaInscrito.estado)}</span>`
            : '';

          return `
            <div class="categoria">
              <span class="categoria__marca" style="--marca:${
                plazo.abierto ? 'var(--neon)' : 'var(--error)'
              }"></span>
              <div class="categoria__datos">
                <span class="categoria__nombre">${escapar(cat.nombre)}</span>
                <span class="categoria__meta">${escapar(rango)} · máx. ${cat.maxJugadores} jugadores · cierra el ${formatearFecha(
            cat.fechaLimite,
            { day: 'numeric', month: 'long' }
          )}</span>
              </div>
              <div class="categoria__acciones">
                ${estadoInsc}${plazo.etiqueta}${plazo.texto}${accion}
              </div>
            </div>`;
        })
        .join('');

      return `
        <div class="torneo">
          <div class="torneo__cabecera">
            <span class="torneo__nombre">${escapar(t.nombre)}</span>
            <span class="torneo__modalidad">${escapar(t.modalidad)}</span>
          </div>
          ${filas || '<div class="vacio">Este torneo todavía no tiene categorías.</div>'}
        </div>`;
    })
    .join('');

  const html = `
    <main class="principal"><div class="contenedor">
      <a class="volver" href="#/inscripcion">← Cambiar de club</a>
      ${barraPasos(2)}

      <div class="ficha">
        ${escudo(club, 'escudo--grande')}
        <div>
          <h1 class="ficha__nombre">${escapar(club.nombre)}</h1>
          <p class="ficha__meta">Dirigente: ${escapar(club.dirigente?.nombre || '—')}</p>
        </div>
      </div>

      <section class="seccion">
        <div class="seccion__cabecera">
          <h2 class="seccion__titulo">Elige torneo y categoría</h2>
          <span class="seccion__nota">Solo puedes inscribirte mientras el plazo siga abierto</span>
        </div>
        <div class="grid-torneos">${bloques}</div>
      </section>
    </div></main>`;

  function activar(raiz, navegar) {
    raiz.addEventListener('click', async (e) => {
      const boton = e.target.closest('.js-inscribir');
      if (!boton) return;
      const categoriaId = boton.dataset.categoria;
      const res = await Datos.crearInscripcion({ clubId: club.id, categoriaId });
      if (!res.ok) {
        boton.insertAdjacentHTML(
          'afterend',
          `<span class="cuenta-atras cuenta-atras--cerrada">${escapar(res.motivo)}</span>`
        );
        return;
      }
      navegar(`#/inscripcion/${club.id}/${categoriaId}`);
    });
  }

  return { html, activar };
}

/* ─────────────────────── paso 3: cargar la nómina ──────────────────────── */

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
    <main class="principal"><div class="contenedor">
      <a class="volver" href="#/inscripcion/${escapar(club.id)}">← Cambiar de categoría</a>
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
      navegar(`#/inscripcion/${club.id}/${categoria.id}`, true);
    });

    raiz.addEventListener('click', async (e) => {
      const boton = e.target.closest('.js-quitar');
      if (!boton) return;
      const res = await Datos.quitarJugador(boton.dataset.jugador);
      if (!res.ok) return avisar('#msj-envio', res.motivo, 'error');
      navegar(`#/inscripcion/${club.id}/${categoria.id}`, true);
    });

    $('#btn-enviar')?.addEventListener('click', async () => {
      const res = await Datos.enviarInscripcion(inscripcion.id);
      if (!res.ok) return avisar('#msj-envio', res.motivo, 'error');
      navegar(`#/inscripcion/${club.id}/${categoria.id}`, true);
    });
  }

  return { html, activar };
}

/* ─────────────────────────────── entrada ───────────────────────────────── */

export function vistaInscripcion(params = {}) {
  if (!params.clubId) return pasoClub();

  const club = Datos.getClub(params.clubId);
  if (!club) return pasoClub();

  if (!params.categoriaId) return pasoCategoria(club);

  const categoria = Datos.getCategoria(params.categoriaId);
  if (!categoria) return pasoCategoria(club);

  const inscripcion = Datos.getInscripciones({
    clubId: club.id,
    categoriaId: categoria.id,
  })[0];
  if (!inscripcion) return pasoCategoria(club);

  return pasoNomina(club, categoria, inscripcion);
}
