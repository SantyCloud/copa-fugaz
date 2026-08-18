/**
 * Arranque y navegación.
 *
 * Router por hash (#/ruta). Sin dependencias y sin build: funciona en cualquier
 * hosting estático y no necesita reescritura de URLs en el servidor, a
 * diferencia de un router por history API.
 */

import { Datos } from './data.js';
import {
  vistaInicio,
  vistaCalendario,
  vistaEquipos,
  vistaEquipo,
  vistaGoleadores,
} from './ui.js';
import { vistaPanel } from './panel.js';
import { vistaInscripcion } from './inscripcion.js';
import { vistaOrganizador } from './organizador.js';

/* ─────────────────────────────── rutas ─────────────────────────────────── */

const RUTAS = [
  { patron: /^\/?$/, vista: vistaInicio, nav: 'inicio' },

  { patron: /^\/inscripcion(?:\/([\w-]+))?(?:\/([\w-]+))?$/,
    vista: vistaInscripcion, nav: 'inscripcion',
    params: (m) => ({ clubId: m[1], categoriaId: m[2] }) },

  { patron: /^\/organizador(?:\/([\w-]+))?$/,
    vista: vistaOrganizador, nav: 'organizador',
    params: (m) => ({ categoriaId: m[1] }) },

  { patron: /^\/calendario(?:\/(\d+))?$/,
    vista: vistaCalendario, nav: 'calendario',
    params: (m) => ({ jornada: m[1] }) },

  { patron: /^\/equipos$/, vista: vistaEquipos, nav: 'equipos' },

  { patron: /^\/equipo\/([\w-]+)$/, vista: vistaEquipo, nav: 'equipos',
    params: (m) => ({ id: m[1] }) },

  { patron: /^\/goleadores$/, vista: vistaGoleadores, nav: 'goleadores' },

  { patron: /^\/panel(?:\/(\d+))?$/, vista: vistaPanel, nav: 'panel',
    params: (m) => ({ id: m[1] }) },
];

function resolver(hash) {
  const ruta = (hash || '').replace(/^#/, '') || '/';
  for (const r of RUTAS) {
    const m = ruta.match(r.patron);
    if (m) return { ...r, argumentos: r.params ? r.params(m) : {} };
  }
  return null;
}

/* ───────────────────────────── renderizado ─────────────────────────────── */

const contenedor = () => document.getElementById('app');

function marcarNavActiva(nombre) {
  document.querySelectorAll('.nav__enlace').forEach((a) => {
    a.classList.toggle('activo', a.dataset.nav === nombre);
  });
}

function pintarError(titulo, detalle) {
  contenedor().innerHTML = `
    <main class="principal"><div class="contenedor" style="max-width:640px">
      <div class="aviso aviso--error">
        <span class="aviso__icono">⚠️</span>
        <div>
          <strong>${titulo}</strong>
          <p style="margin-top:6px">${detalle}</p>
        </div>
      </div>
    </div></main>`;
}

function navegar(hash, reemplazar = false) {
  if (reemplazar) {
    history.replaceState(null, '', hash);
    pintar();
  } else if (location.hash === hash) {
    pintar();
  } else {
    location.hash = hash;
  }
}

function pintar() {
  const ruta = resolver(location.hash);

  if (!ruta) {
    marcarNavActiva(null);
    pintarError(
      'Página no encontrada',
      'Esa dirección no existe. <a href="#/" style="color:var(--neon);font-weight:700">Volver al inicio</a>.'
    );
    return;
  }

  let resultado;
  try {
    resultado = ruta.vista(ruta.argumentos);
  } catch (error) {
    console.error('Error al construir la vista:', error);
    pintarError('Algo falló al mostrar esta página', 'Recarga la página para intentarlo de nuevo.');
    return;
  }

  contenedor().innerHTML = resultado.html;
  marcarNavActiva(ruta.nav);
  window.scrollTo({ top: 0, behavior: 'instant' });

  if (typeof resultado.activar === 'function') {
    resultado.activar(contenedor(), navegar);
  }
}

/* ─────────────────────────────── arranque ──────────────────────────────── */

async function iniciar() {
  try {
    await Datos.cargar();
  } catch (error) {
    console.error(error);
    pintarError(
      'No se pudieron cargar los datos',
      'Si has abierto el archivo con doble clic, el navegador bloquea la lectura de los ' +
        'datos por seguridad. Hay que servir la carpeta con un servidor web. ' +
        'En el sitio publicado esto no ocurre.'
    );
    return;
  }

  const torneo = Datos.getTorneo();
  const anio = document.getElementById('pie-anio');
  if (anio) anio.textContent = torneo?.temporada || '';

  window.addEventListener('hashchange', pintar);
  pintar();
}

iniciar();
