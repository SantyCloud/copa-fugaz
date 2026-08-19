/**
 * Arranque, navegación y control de acceso.
 *
 * Router por hash (#/ruta). Sin dependencias y sin build: funciona en cualquier
 * hosting estático y no necesita reescritura de URLs en el servidor.
 *
 * Cada ruta declara qué hace falta para entrar:
 *   sin `requiere`      → pública (la liga la puede ver cualquiera)
 *   'sesion'            → hay que haber entrado
 *   'organizador'       → solo el organizador
 */

import { Datos } from './data.js';
import { Sesion } from './sesion.js';
import {
  vistaInicio,
  vistaCalendario,
  vistaEquipos,
  vistaEquipo,
  vistaGoleadores,
  escapar,
} from './ui.js';
import { vistaPanel } from './panel.js';
import { vistaInscripcion } from './inscripcion.js';
import { vistaOrganizador } from './organizador.js';
import { vistaAcceso, vistaSinPermiso } from './acceso.js';
import { vistaPortada } from './inicio.js';
import { cargarPlanes, vistaPlanes, vistaMembresiaRequerida } from './membresia.js';
import { vistaEstadisticas } from './estadisticas.js';
import { activarAnimaciones, detenerAnimaciones } from './animaciones.js';

/* ─────────────────────────────── rutas ─────────────────────────────────── */

const RUTAS = [
  { patron: /^\/?$/, vista: vistaPortada, nav: 'portada' },

  { patron: /^\/liga$/, vista: vistaInicio, nav: 'liga' },

  { patron: /^\/planes$/, vista: vistaPlanes, nav: 'planes' },

  { patron: /^\/entrar(?:\/(.+))?$/, vista: vistaAcceso, nav: 'entrar',
    params: (m) => ({ destino: m[1] }) },

  { patron: /^\/inscripcion(?:\/([\w-]+))?(?:\/([\w-]+))?$/,
    vista: vistaInscripcion, nav: 'inscripcion', requiere: 'sesion',
    params: (m) => ({ clubId: m[1], categoriaId: m[2] }) },

  { patron: /^\/organizador(?:\/([\w-]+))?$/,
    vista: vistaOrganizador, nav: 'organizador', requiere: 'membresia',
    params: (m) => ({ categoriaId: m[1] }) },

  { patron: /^\/calendario(?:\/(\d+))?$/,
    vista: vistaCalendario, nav: 'calendario',
    params: (m) => ({ jornada: m[1] }) },

  { patron: /^\/equipos$/, vista: vistaEquipos, nav: 'equipos' },

  { patron: /^\/equipo\/([\w-]+)$/, vista: vistaEquipo, nav: 'equipos',
    params: (m) => ({ id: m[1] }) },

  { patron: /^\/goleadores$/, vista: vistaGoleadores, nav: 'liga' },

  { patron: /^\/estadisticas$/, vista: vistaEstadisticas, nav: 'estadisticas' },

  { patron: /^\/panel(?:\/(\d+))?$/, vista: vistaPanel, nav: 'panel',
    requiere: 'membresia',
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

/** Enseña u oculta los enlaces según quién haya entrado. */
function ajustarNav() {
  const conPanel = Sesion.esOrganizador() && Sesion.tieneMembresiaActiva();
  const dirigente = Sesion.esDirigente();
  document.querySelectorAll('.nav__enlace[data-solo]').forEach((a) => {
    const solo = a.dataset.solo;
    const visible = solo === 'organizador' ? conPanel : dirigente;
    a.classList.toggle('oculto', !visible);
  });
}

/** Chip de la cabecera con quién está dentro. */
function pintarSesion() {
  const caja = document.getElementById('caja-sesion');
  if (!caja) return;
  const s = Sesion.actual();

  if (!s) {
    caja.innerHTML = `<a class="boton boton--chico" href="#/entrar">Entrar</a>`;
    return;
  }

  const club = s.clubId ? Datos.getClub(s.clubId) : null;
  caja.innerHTML = `
    <div class="sesion">
      <span class="sesion__datos">
        <span class="sesion__nombre">${escapar(club ? club.nombre : s.nombre)}</span>
        <span class="sesion__rol">${s.rol === 'organizador' ? 'Organizador' : 'Dirigente'}</span>
      </span>
      <button type="button" class="boton boton--secundario boton--chico" id="btn-salir">Salir</button>
    </div>`;

  document.getElementById('btn-salir').addEventListener('click', () => {
    Sesion.salir();
    navegar('#/entrar');
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

/** Devuelve la vista a pintar, o null si la ruta está permitida. */
function comprobarPermiso(ruta) {
  if (!ruta.requiere) return null;

  if (!Sesion.hayAlguien()) {
    // Le mandamos a entrar y recordamos a dónde quería ir.
    const destino = encodeURIComponent(location.hash || '#/');
    navegar(`#/entrar/${destino}`, true);
    return 'redirigido';
  }

  const soloOrganizador = ruta.requiere === 'organizador' || ruta.requiere === 'membresia';
  if (soloOrganizador && !Sesion.esOrganizador()) {
    return vistaSinPermiso(
      'Esta parte es de quien organiza el torneo. Con tu cuenta de dirigente puedes ' +
        'inscribir a los jugadores de tu club desde la sección Mi club.'
    );
  }

  // Organizar torneos es de pago; inscribir un club, no.
  if (ruta.requiere === 'membresia' && !Sesion.tieneMembresiaActiva()) {
    return vistaMembresiaRequerida();
  }

  return null;
}

function pintar() {
  detenerAnimaciones();
  const ruta = resolver(location.hash);
  pintarSesion();
  ajustarNav();

  if (!ruta) {
    marcarNavActiva(null);
    pintarError(
      'Página no encontrada',
      'Esa dirección no existe. <a href="#/" style="color:var(--neon);font-weight:700">Volver al inicio</a>.'
    );
    return;
  }

  const bloqueo = comprobarPermiso(ruta);
  if (bloqueo === 'redirigido') return;

  let resultado;
  try {
    resultado = bloqueo || ruta.vista(ruta.argumentos);
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

  // Las animaciones se rearman en cada vista y se detienen al cambiar.
  activarAnimaciones(contenedor());
}

/* ─────────────────────────────── arranque ──────────────────────────────── */

async function iniciar() {
  try {
    await Promise.all([Datos.cargar(), Sesion.cargar(), cargarPlanes()]);
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
