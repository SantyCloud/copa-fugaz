/**
 * Planes y membresía.
 *
 * Organizar un torneo es de pago; inscribir un club es gratis.
 *
 * ⚠️ En el demo la activación es inmediata y no cobra nada: sirve para que el
 * cliente vea la puerta y lo que hay detrás. En producción, quien confirma el
 * pago es la pasarela (Stripe, Mercado Pago o la que se elija) mediante un
 * webhook contra el servidor, nunca el navegador.
 *
 * Los precios viven en `data/planes.json` para poder cambiarlos sin tocar código.
 */

import { Sesion } from './sesion.js';
import { escapar } from './ui.js';

let catalogo = null;

export async function cargarPlanes() {
  if (catalogo) return catalogo;
  const res = await fetch('data/planes.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error(`No se pudieron cargar los planes (HTTP ${res.status})`);
  catalogo = await res.json();
  return catalogo;
}

export function planPorId(id) {
  return catalogo?.planes.find((p) => p.id === id) || null;
}

function tarjetaPlan(plan, simbolo, sesion) {
  const activo =
    sesion && Sesion.tieneMembresiaActiva() && Sesion.membresia()?.plan === plan.id;

  const precio =
    plan.precio === 0
      ? '<span class="plan__precio">Gratis</span>'
      : `<span class="plan__precio">${escapar(simbolo)}${plan.precio}</span>
         <span class="plan__periodo">/${escapar(plan.periodo)}</span>`;

  const incluye = plan.incluye
    .map((t) => `<li class="plan__punto">${escapar(t)}</li>`)
    .join('');

  const noIncluye = plan.noIncluye
    .map((t) => `<li class="plan__punto plan__punto--no">${escapar(t)}</li>`)
    .join('');

  let accion;
  if (activo) {
    accion = `<button class="boton boton--ancho" disabled>Tu plan actual</button>`;
  } else if (!sesion) {
    accion = `<a class="boton ${plan.destacado ? '' : 'boton--secundario'} boton--ancho"
                 href="#/entrar/${encodeURIComponent('#/planes')}">Entrar para contratar</a>`;
  } else if (sesion.rol !== 'organizador') {
    accion = `<button class="boton boton--secundario boton--ancho" disabled>Solo para organizadores</button>`;
  } else {
    accion = `<button class="boton ${plan.destacado ? '' : 'boton--secundario'} boton--ancho js-contratar"
                 data-plan="${escapar(plan.id)}">
                ${plan.precio === 0 ? 'Empezar gratis' : 'Contratar'}
              </button>`;
  }

  return `
    <div class="plan ${plan.destacado ? 'plan--destacado' : ''}">
      ${plan.destacado ? '<span class="plan__cinta">El más elegido</span>' : ''}
      <h3 class="plan__nombre">${escapar(plan.nombre)}</h3>
      <div class="plan__importe">${precio}</div>
      <p class="plan__resumen">${escapar(plan.resumen)}</p>
      <ul class="plan__lista">${incluye}${noIncluye}</ul>
      ${accion}
    </div>`;
}

export function vistaPlanes() {
  const sesion = Sesion.actual();
  const { planes, simbolo } = catalogo;
  const membresia = Sesion.membresia();
  const activa = Sesion.tieneMembresiaActiva();

  const estado =
    sesion?.rol === 'organizador'
      ? activa
        ? `<div class="aviso aviso--exito">
             <span class="aviso__icono">✅</span>
             <div>Tu membresía <strong>${escapar(planPorId(membresia.plan)?.nombre || membresia.plan)}</strong>
             está activa hasta el ${escapar(membresia.vence)}.
             <a href="#/organizador" style="color:var(--neon);font-weight:700">Ir a mi panel →</a></div>
           </div>`
        : `<div class="aviso aviso--alerta">
             <span class="aviso__icono">🔒</span>
             <div><strong>Tu cuenta todavía no tiene membresía.</strong> Elige un plan para
             poder crear torneos, abrir categorías y fijar los plazos de inscripción.</div>
           </div>`
      : '';

  const html = `
    <main class="principal"><div class="contenedor">
      <section class="seccion">
        <div class="seccion__cabecera">
          <h1 class="seccion__titulo">Planes</h1>
          <span class="seccion__nota">Solo paga quien organiza. Los clubes se inscriben gratis.</span>
        </div>
        ${estado}
        <div class="planes">
          ${planes.map((p) => tarjetaPlan(p, simbolo, sesion)).join('')}
        </div>
        <div id="msj-plan"></div>
      </section>

      <section class="seccion">
        <div class="tarjeta"><div class="tarjeta__cuerpo">
          <h2 class="seccion__titulo" style="margin-bottom:10px">Preguntas frecuentes</h2>
          <details class="pregunta">
            <summary>¿Los clubes también pagan?</summary>
            <p>No. La membresía la paga quien organiza el torneo. Los dirigentes entran con
            la cuenta que les da el organizador e inscriben a sus jugadores gratis.</p>
          </details>
          <details class="pregunta">
            <summary>¿Puedo probar antes de pagar?</summary>
            <p>Sí. El plan Prueba te deja montar un torneo con una categoría y hasta seis
            clubes, para que veas cómo funciona con tu propia gente.</p>
          </details>
          <details class="pregunta">
            <summary>¿Qué pasa si dejo de pagar?</summary>
            <p>La página pública de tu liga sigue visible y los datos no se borran, pero no
            puedes crear torneos nuevos ni modificar los plazos hasta que renueves.</p>
          </details>
          <details class="pregunta">
            <summary>¿Y los datos de los jugadores?</summary>
            <p>Son de la liga, no nuestros. Puedes descargarlos cuando quieras y pedir que
            se borren.</p>
          </details>
        </div></div>
      </section>

    </div></main>`;

  function activar(raiz, navegar) {
    raiz.addEventListener('click', async (e) => {
      const boton = e.target.closest('.js-contratar');
      if (!boton) return;

      const res = await Sesion.activarPlan(boton.dataset.plan);
      const caja = raiz.querySelector('#msj-plan');
      if (!res.ok) {
        caja.innerHTML = `<div class="aviso aviso--error" style="margin-top:14px">
          <span class="aviso__icono">⚠️</span><div>${escapar(res.motivo)}</div></div>`;
        return;
      }
      navegar('#/organizador');
    });
  }

  return { html, activar };
}

/** Pantalla que ve un organizador sin membresía al intentar entrar al panel. */
export function vistaMembresiaRequerida() {
  return {
    html: `
      <main class="principal"><div class="contenedor" style="max-width:560px">
        <div class="aviso aviso--alerta">
          <span class="aviso__icono">🔒</span>
          <div>
            <strong>Necesitas una membresía para organizar torneos.</strong>
            <p style="margin-top:6px">Crear torneos, abrir categorías y fijar los plazos de
            inscripción forma parte de los planes de organizador. Inscribir un club, en
            cambio, siempre es gratis.</p>
          </div>
        </div>
        <div class="acciones" style="border:0">
          <a class="boton" href="#/planes">Ver planes</a>
          <a class="boton boton--secundario" href="#/">Volver al inicio</a>
        </div>
      </div></main>`,
  };
}
