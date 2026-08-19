/**
 * Pantalla de acceso.
 *
 * El organizador entra con la cuenta de la liga. Cada dirigente entra con el
 * acceso que le entrega el organizador al registrar su club.
 */

import { Sesion } from './sesion.js';
import { escapar } from './ui.js';

export function vistaAcceso(params = {}) {
  const destino = params.destino ? decodeURIComponent(params.destino) : '';
  const yaDentro = Sesion.actual();

  const html = `
    <main class="principal"><div class="contenedor contenedor--estrecho">
      <div class="acceso revelar">
        <div class="acceso__marca">
          <img src="assets/img/escudo.png" width="76" height="76"
               alt="Escudo de la Liga de Fútbol Amateur Fugaz">
        </div>

        <h1 class="acceso__titulo">Entrar</h1>
        <p class="acceso__sub">Gestiona tu torneo o la nómina de tu club.</p>

        ${
          yaDentro
            ? `<div class="aviso aviso--info">
                 <span class="aviso__icono">👤</span>
                 <div>Ya has entrado como <strong>${escapar(yaDentro.nombre)}</strong>.
                 <a href="#/" style="color:var(--neon);font-weight:700">Ir al inicio</a></div>
               </div>`
            : ''
        }

        <div class="campo">
          <label class="campo__etiqueta" for="a-usuario">Usuario</label>
          <input class="entrada" id="a-usuario" autocomplete="username"
                 autocapitalize="none" spellcheck="false" placeholder="tu usuario">
        </div>

        <div class="campo" style="margin-top:12px">
          <label class="campo__etiqueta" for="a-clave">Contraseña</label>
          <input class="entrada" id="a-clave" type="password"
                 autocomplete="current-password" placeholder="tu contraseña">
        </div>

        <div id="msj-acceso"></div>

        <button class="boton boton--ancho" id="btn-entrar" style="margin-top:18px">Entrar</button>

        <hr class="separador">

        <p class="acceso__pregunta">¿Es la primera vez que entras?</p>
        <a class="boton boton--secundario boton--ancho" href="#/registro">
          Crear la cuenta de mi club
        </a>

        <p class="acceso__pie">
          ¿Organizas un torneo? <a href="#/planes">Mira los planes</a>.
        </p>
      </div>
    </div></main>`;

  function activar(raiz, navegar) {
    const $ = (s) => raiz.querySelector(s);

    const avisar = (texto) => {
      $('#msj-acceso').innerHTML = texto
        ? `<div class="aviso aviso--error" style="margin:16px 0 0">
             <span class="aviso__icono">⚠️</span><div>${escapar(texto)}</div></div>`
        : '';
    };

    const entrar = async () => {
      const res = await Sesion.entrar($('#a-usuario').value, $('#a-clave').value);
      if (!res.ok) return avisar(res.motivo);

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

    $('#a-usuario').focus();
  }

  return { html, activar };
}

/** Pantalla que se enseña cuando alguien intenta entrar donde no le toca. */
export function vistaSinPermiso(mensaje) {
  return {
    html: `
      <main class="principal"><div class="contenedor contenedor--estrecho">
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
