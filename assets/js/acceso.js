/**
 * Pantalla de acceso.
 *
 * Enseña las cuentas de ejemplo a propósito: es una demostración y el cliente
 * tiene que poder entrar sin recordar nada. En producción esto desaparece.
 */

import { Sesion } from './sesion.js';
import { Datos } from './data.js';
import { escapar, escudo } from './ui.js';

export function vistaAcceso(params = {}) {
  const destino = params.destino ? decodeURIComponent(params.destino) : '';
  const yaDentro = Sesion.actual();

  const claveDirigente = Sesion.claveDemo('dirigente');
  const claveOrganizador = Sesion.claveDemo('organizador');

  const dirigentes = Sesion.cuentasDemo()
    .filter((c) => c.rol === 'dirigente')
    .map((c) => {
      const club = Datos.getClub(c.clubId);
      return `
        <button type="button" class="cuenta js-rellenar" data-usuario="${escapar(c.usuario)}"
                data-clave="${escapar(claveDirigente)}">
          ${escudo(club, 'escudo--mini')}
          <span class="cuenta__texto">
            <span class="cuenta__nombre">${escapar(club?.nombre || c.nombre)}</span>
            <span class="cuenta__usuario">${escapar(c.usuario)}</span>
          </span>
        </button>`;
    })
    .join('');

  const html = `
    <main class="principal"><div class="contenedor" style="max-width:520px">

      ${
        yaDentro
          ? `<div class="aviso aviso--info">
               <span class="aviso__icono">👤</span>
               <div>Ya has entrado como <strong>${escapar(yaDentro.nombre)}</strong>.
               Puedes <a href="#/" style="color:var(--neon);font-weight:700">ir al inicio</a>
               o entrar con otra cuenta desde aquí.</div>
             </div>`
          : ''
      }

      <section class="seccion">
        <div class="seccion__cabecera">
          <h1 class="seccion__titulo">Entrar</h1>
        </div>

        <div class="tarjeta"><div class="tarjeta__cuerpo">
          <div class="rejilla-campos">
            <div class="campo campo--ancho">
              <label class="campo__etiqueta" for="a-usuario">Usuario</label>
              <input class="entrada" id="a-usuario" autocomplete="username"
                     autocapitalize="none" spellcheck="false" placeholder="organizador">
            </div>
            <div class="campo campo--ancho">
              <label class="campo__etiqueta" for="a-clave">Contraseña</label>
              <input class="entrada" id="a-clave" type="password"
                     autocomplete="current-password" placeholder="••••••••">
            </div>
          </div>
          <div id="msj-acceso"></div>
          <div class="acciones">
            <button class="boton boton--ancho" id="btn-entrar">Entrar</button>
          </div>
        </div></div>
      </section>

      <section class="seccion">
        <div class="seccion__cabecera">
          <h2 class="seccion__titulo">Cuentas de prueba</h2>
          <span class="seccion__nota">Toca una y se rellena sola</span>
        </div>

        <div class="tarjeta" style="margin-bottom:12px">
          <div class="tarjeta__titulo">Organizador — ve y controla toda la liga</div>
          <div style="padding:8px">
            <button type="button" class="cuenta js-rellenar"
                    data-usuario="organizador" data-clave="${escapar(claveOrganizador)}">
              <span class="escudo escudo--mini" style="background:var(--neon);color:var(--sobre-neon)">LF</span>
              <span class="cuenta__texto">
                <span class="cuenta__nombre">Organizador de la Liga</span>
                <span class="cuenta__usuario">organizador · ${escapar(claveOrganizador)}</span>
              </span>
            </button>
          </div>
        </div>

        <div class="tarjeta">
          <div class="tarjeta__titulo">Dirigentes — cada uno solo ve su club
            <span class="seccion__nota" style="font-weight:400"> · contraseña ${escapar(claveDirigente)}</span>
          </div>
          <div style="padding:8px">${dirigentes}</div>
        </div>
      </section>

      <div class="aviso aviso--alerta">
        <span class="aviso__icono">⚠️</span>
        <div><strong>Acceso de demostración.</strong> Las contraseñas están a la vista
        porque esto es una prueba para validar el flujo. En la versión final las cuentas
        irán en la base de datos, las contraseñas viajarán cifradas y nadie podrá ver la
        nómina de otro club. <strong>No uses aquí una contraseña que uses de verdad.</strong></div>
      </div>

    </div></main>`;

  function activar(raiz, navegar) {
    const $ = (s) => raiz.querySelector(s);

    const avisar = (texto) => {
      $('#msj-acceso').innerHTML = texto
        ? `<div class="aviso aviso--error" style="margin:14px 0 0">
             <span class="aviso__icono">⚠️</span><div>${escapar(texto)}</div></div>`
        : '';
    };

    const entrar = async () => {
      const res = await Sesion.entrar($('#a-usuario').value, $('#a-clave').value);
      if (!res.ok) return avisar(res.motivo);
      // A donde iba antes de que le pidiéramos entrar, o a su sitio por defecto.
      // Un organizador sin membresía va a los planes: el panel le estaría cerrado.
      const porDefecto =
        res.sesion.rol !== 'organizador'
          ? '#/inscripcion'
          : Sesion.tieneMembresiaActiva()
          ? '#/organizador'
          : '#/planes';
      navegar(destino || porDefecto);
    };

    $('#btn-entrar').addEventListener('click', entrar);
    raiz.querySelectorAll('.entrada').forEach((campo) => {
      campo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') entrar();
      });
    });

    raiz.addEventListener('click', (e) => {
      const boton = e.target.closest('.js-rellenar');
      if (!boton) return;
      $('#a-usuario').value = boton.dataset.usuario;
      $('#a-clave').value = boton.dataset.clave;
      avisar('');
      $('#btn-entrar').focus();
    });
  }

  return { html, activar };
}

/** Pantalla que se enseña cuando alguien intenta entrar donde no le toca. */
export function vistaSinPermiso(mensaje) {
  return {
    html: `
      <main class="principal"><div class="contenedor" style="max-width:520px">
        <div class="aviso aviso--error">
          <span class="aviso__icono">🔒</span>
          <div>
            <strong>Esta zona no es para tu cuenta.</strong>
            <p style="margin-top:6px">${escapar(mensaje)}</p>
          </div>
        </div>
        <div class="acciones" style="border:0">
          <a class="boton" href="#/entrar">Entrar con otra cuenta</a>
          <a class="boton boton--secundario" href="#/">Ir al inicio</a>
        </div>
      </div></main>`,
  };
}
