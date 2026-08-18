/**
 * Arranque y navegación.
 *
 * Router por hash (#/ruta). Sin dependencias y sin build: funciona en cualquier
 * hosting estático y no necesita configuración de reescritura de URLs en el
 * servidor, a diferencia de un router por history API.
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

const CLAVE_TEMA = 'copa-fugaz:tema';

/* ─────────────────────────────── rutas ─────────────────────────────────── */

const RUTAS = [
  { patron: /^\/?$/,                    vista: vistaInicio,      nav: 'inicio' },
  { patron: /^\/calendario(?:\/(\d+))?$/, vista: vistaCalendario, nav: 'calendario',
    params: (m) => ({ jornada: m[1] }) },
  { patron: /^\/equipos$/,              vista: vistaEquipos,     nav: 'equipos' },
  { patron: /^\/equipo\/([\w-]+)$/,     vista: vistaEquipo,      nav: 'equipos',
    params: (m) => ({ id: m[1] }) },
  { patron: /^\/goleadores$/,           vista: vistaGoleadores,  nav: 'goleadores' },
  { patron: /^\/panel(?:\/(\d+))?$/,    vista: vistaPanel,       nav: 'panel',
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

/* ─────────────────────────────── tema ──────────────────────────────────── */

function temaGuardado() {
  try {
    return localStorage.getItem(CLAVE_TEMA);
  } catch {
    return null;
  }
}

function aplicarTema(tema) {
  if (tema) document.documentElement.setAttribute('data-tema', tema);
  else document.documentElement.removeAttribute('data-tema');

  const boton = document.getElementById('btn-tema');
  if (!boton) return;
  const oscuroActivo =
    tema === 'oscuro' ||
    (!tema && window.matchMedia('(prefers-color-scheme: dark)').matches);
  boton.textContent = oscuroActivo ? '☀' : '☾';
  boton.setAttribute(
    'aria-label',
    oscuroActivo ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
  );
}

function alternarTema() {
  const actual = document.documentElement.getAttribute('data-tema');
  const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const siguiente = actual
    ? actual === 'oscuro' ? 'claro' : 'oscuro'
    : prefiereOscuro ? 'claro' : 'oscuro';
  try {
    localStorage.setItem(CLAVE_TEMA, siguiente);
  } catch {
    /* modo incógnito: el tema no se recuerda, pero sí se aplica */
  }
  aplicarTema(siguiente);
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
          <p style="margin-top:6px;color:var(--texto-medio)">${detalle}</p>
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
      'Esa dirección no existe. <a href="#/" style="color:var(--acento);font-weight:600">Volver al inicio</a>.'
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
  aplicarTema(temaGuardado());
  document.getElementById('btn-tema')?.addEventListener('click', alternarTema);

  try {
    await Datos.cargar();
  } catch (error) {
    console.error(error);
    pintarError(
      'No se pudieron cargar los datos del campeonato',
      'Si has abierto el archivo directamente con doble clic, el navegador bloquea la ' +
        'lectura de los datos por seguridad. Hay que servir la carpeta con un servidor web. ' +
        'En producción esto no ocurre.'
    );
    return;
  }

  const torneo = Datos.getTorneo();
  document.title = `${torneo.nombre} ${torneo.temporada}`;
  const marca = document.getElementById('marca-nombre');
  if (marca) marca.textContent = torneo.nombre;
  const temporada = document.getElementById('marca-temporada');
  if (temporada) temporada.textContent = torneo.temporada;
  const anio = document.getElementById('pie-anio');
  if (anio) anio.textContent = torneo.temporada;

  window.addEventListener('hashchange', pintar);
  pintar();
}

iniciar();
