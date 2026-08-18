/**
 * Panel de administración: cargar y corregir resultados.
 *
 * Escribe siempre a través de Datos.guardarResultado(), nunca directamente.
 * Cuando se migre a Supabase esta vista no cambia — lo que cambia es lo que
 * hace `data.js` por debajo.
 */

import { Datos } from './data.js';
import { agruparPorJornada } from './liga.js';
import { escapar, escudo } from './ui.js';

/** Filas de goleadores que el usuario está editando ahora mismo. */
let borrador = [];

function opcionesPartidos(seleccionadoId) {
  return agruparPorJornada(Datos.getPartidos())
    .map((j) => {
      const opciones = j.partidos
        .map((p) => {
          const local = Datos.getEquipo(p.localId);
          const visitante = Datos.getEquipo(p.visitanteId);
          if (!local || !visitante) return '';
          const marcador =
            p.estado === 'jugado' ? ` (${p.golesLocal}-${p.golesVisitante})` : '';
          return (
            `<option value="${p.id}" ${p.id === seleccionadoId ? 'selected' : ''}>` +
            `${escapar(local.nombre)} vs ${escapar(visitante.nombre)}${escapar(marcador)}` +
            `</option>`
          );
        })
        .join('');
      return `<optgroup label="Jornada ${j.jornada}">${opciones}</optgroup>`;
    })
    .join('');
}

function opcionesJugadores(partido, seleccionadoId) {
  const lados = [
    { equipoId: partido.localId },
    { equipoId: partido.visitanteId },
  ];
  return (
    `<option value="">— elegir jugador —</option>` +
    lados
      .map(({ equipoId }) => {
        const equipo = Datos.getEquipo(equipoId);
        if (!equipo) return '';
        const jugadores = Datos.getJugadores(equipoId)
          .map(
            (j) =>
              `<option value="${j.id}" ${j.id === seleccionadoId ? 'selected' : ''}>` +
              `${j.dorsal}. ${escapar(j.nombre)}</option>`
          )
          .join('');
        return `<optgroup label="${escapar(equipo.nombre)}">${jugadores}</optgroup>`;
      })
      .join('')
  );
}

function filasGoleadores(partido) {
  if (!borrador.length) {
    return `<p class="seccion__nota" style="padding:6px 0">Sin goleadores anotados. Añade uno con el botón de abajo.</p>`;
  }
  return borrador
    .map(
      (g, i) => `
      <div class="fila-goleador" data-indice="${i}">
        <select class="selector js-goleador" aria-label="Jugador que marcó">
          ${opcionesJugadores(partido, g.jugadorId)}
        </select>
        <input class="entrada js-minuto" type="number" min="1" max="120"
               placeholder="min" value="${g.minuto || ''}" aria-label="Minuto del gol">
        <button type="button" class="boton boton--secundario boton--chico js-quitar-gol"
                aria-label="Quitar este gol">✕</button>
      </div>`
    )
    .join('');
}

export function vistaPanel(params = {}) {
  const partidos = Datos.getPartidos();
  if (!partidos.length) {
    return {
      html: `<main class="principal"><div class="contenedor">
        <p class="vacio">No hay partidos que administrar.</p></div></main>`,
    };
  }

  const idPedido = Number(params.id);
  const partido =
    partidos.find((p) => p.id === idPedido) ||
    partidos.find((p) => p.estado === 'pendiente') ||
    partidos[0];

  const local = Datos.getEquipo(partido.localId);
  const visitante = Datos.getEquipo(partido.visitanteId);

  // El borrador arranca con los goleadores ya guardados del partido.
  borrador = (partido.goleadores || []).map((g) => ({ ...g }));

  const html = `
    <main class="principal">
      <div class="contenedor" style="max-width:760px">
        <section class="seccion">
          <div class="seccion__cabecera">
            <h1 class="seccion__titulo">Panel de resultados</h1>
          </div>

          <div class="aviso aviso--info">
            <span class="aviso__icono">🔒</span>
            <div>
              <strong>Versión de demostración.</strong> Los cambios se guardan en este
              navegador para que puedas probar la web. En producción se guardarán en la
              base de datos y el panel estará protegido con usuario y contraseña.
            </div>
          </div>

          <div class="tarjeta">
            <div class="tarjeta__cuerpo">
              <div class="campo">
                <label class="campo__etiqueta" for="sel-partido">Partido</label>
                <select class="selector" id="sel-partido">${opcionesPartidos(partido.id)}</select>
              </div>

              <div class="panel-marcador">
                <div class="panel-marcador__lado">
                  ${escudo(local, 'escudo--grande')}
                  <span class="panel-marcador__nombre">${escapar(local?.nombre || '—')}</span>
                  <input class="entrada panel-marcador__goles" id="goles-local" type="number"
                         min="0" max="99" value="${partido.golesLocal ?? 0}"
                         aria-label="Goles de ${escapar(local?.nombre || 'local')}">
                </div>
                <span class="panel-marcador__vs">–</span>
                <div class="panel-marcador__lado">
                  ${escudo(visitante, 'escudo--grande')}
                  <span class="panel-marcador__nombre">${escapar(visitante?.nombre || '—')}</span>
                  <input class="entrada panel-marcador__goles" id="goles-visitante" type="number"
                         min="0" max="99" value="${partido.golesVisitante ?? 0}"
                         aria-label="Goles de ${escapar(visitante?.nombre || 'visitante')}">
                </div>
              </div>

              <div class="campo" style="margin-top:6px">
                <span class="campo__etiqueta">Goleadores</span>
                <div class="lista-goleadores" id="lista-goleadores">${filasGoleadores(partido)}</div>
                <button type="button" class="boton boton--secundario boton--chico"
                        id="btn-anadir-gol" style="align-self:flex-start;margin-top:9px">
                  + Añadir goleador
                </button>
              </div>

              <div id="mensaje-panel"></div>

              <div class="acciones">
                <button type="button" class="boton" id="btn-guardar">Guardar resultado</button>
                <button type="button" class="boton boton--secundario" id="btn-borrar"
                        ${partido.estado === 'jugado' ? '' : 'disabled'}>
                  Marcar como no jugado
                </button>
                <button type="button" class="boton boton--peligro" id="btn-restaurar"
                        style="margin-left:auto"
                        ${Datos.hayCambiosLocales() ? '' : 'disabled'}>
                  Descartar todos mis cambios
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>`;

  function activar(raiz, navegar) {
    const $ = (sel) => raiz.querySelector(sel);
    const lista = $('#lista-goleadores');
    const mensaje = $('#mensaje-panel');

    const avisar = (texto, tipo = 'info') => {
      mensaje.innerHTML = texto
        ? `<div class="aviso aviso--${tipo}" style="margin:16px 0 0">
             <span class="aviso__icono">${tipo === 'error' ? '⚠️' : '✅'}</span>
             <div>${escapar(texto)}</div>
           </div>`
        : '';
    };

    const repintarGoleadores = () => {
      lista.innerHTML = filasGoleadores(partido);
    };

    // Cambiar de partido → recarga la vista con el nuevo id en la URL.
    $('#sel-partido').addEventListener('change', (e) => {
      navegar(`#/panel/${e.target.value}`);
    });

    $('#btn-anadir-gol').addEventListener('click', () => {
      borrador.push({ jugadorId: '', minuto: '' });
      repintarGoleadores();
      avisar('');
    });

    // Delegación: los controles de cada fila se recrean al repintar.
    lista.addEventListener('click', (e) => {
      const boton = e.target.closest('.js-quitar-gol');
      if (!boton) return;
      const indice = Number(boton.closest('.fila-goleador').dataset.indice);
      borrador.splice(indice, 1);
      repintarGoleadores();
    });

    lista.addEventListener('change', (e) => {
      const fila = e.target.closest('.fila-goleador');
      if (!fila) return;
      const indice = Number(fila.dataset.indice);
      if (e.target.classList.contains('js-goleador')) {
        borrador[indice].jugadorId = e.target.value;
      } else if (e.target.classList.contains('js-minuto')) {
        borrador[indice].minuto = e.target.value;
      }
    });

    $('#btn-guardar').addEventListener('click', async () => {
      const gl = Number($('#goles-local').value);
      const gv = Number($('#goles-visitante').value);

      if (!Number.isInteger(gl) || !Number.isInteger(gv) || gl < 0 || gv < 0) {
        return avisar('Los goles deben ser números enteros de 0 o más.', 'error');
      }

      const goleadores = borrador.filter((g) => g.jugadorId);

      // Los goleadores de cada equipo no pueden superar los goles de ese equipo.
      let porLocal = 0;
      let porVisitante = 0;
      for (const g of goleadores) {
        const jugador = Datos.getJugador(Number(g.jugadorId));
        if (!jugador) continue;
        if (jugador.equipoId === partido.localId) porLocal++;
        else if (jugador.equipoId === partido.visitanteId) porVisitante++;
      }
      const desajuste = (cuantos, equipo, goles) =>
        `Has anotado ${cuantos} ${cuantos === 1 ? 'goleador' : 'goleadores'} de ` +
        `${equipo.nombre}, pero su marcador es ${goles}.`;

      if (porLocal > gl) return avisar(desajuste(porLocal, local, gl), 'error');
      if (porVisitante > gv) return avisar(desajuste(porVisitante, visitante, gv), 'error');

      const res = await Datos.guardarResultado(partido.id, {
        golesLocal: gl,
        golesVisitante: gv,
        goleadores,
      });

      if (!res.ok) return avisar(res.motivo || 'No se pudo guardar.', 'error');

      const faltan = gl + gv - goleadores.length;
      const nota =
        faltan > 0
          ? ` Quedan ${faltan} ${faltan === 1 ? 'gol' : 'goles'} sin goleador asignado.`
          : '';
      avisar(`Resultado guardado.${nota}`);

      $('#btn-borrar').disabled = false;
      $('#btn-restaurar').disabled = false;
    });

    $('#btn-borrar').addEventListener('click', async () => {
      const res = await Datos.borrarResultado(partido.id);
      if (!res.ok) return avisar(res.motivo || 'No se pudo borrar.', 'error');
      borrador = [];
      navegar(`#/panel/${partido.id}`, true);
    });

    $('#btn-restaurar').addEventListener('click', async () => {
      const seguro = confirm(
        'Se descartarán todos los resultados que hayas cargado y la web volverá a los datos originales. ¿Continuar?'
      );
      if (!seguro) return;
      await Datos.restaurarOriginales();
      borrador = [];
      navegar('#/panel', true);
    });
  }

  return { html, activar };
}
