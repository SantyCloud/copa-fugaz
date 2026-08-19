/**
 * Crear cuenta de club.
 *
 * Un solo formulario, sin pasos ni jerga: el dirigente pone el nombre de su
 * club, el suyo, y elige usuario y contraseña. Al terminar ya está dentro.
 *
 * Pensado para gente que no se maneja con webs: campos grandes, una
 * indicación debajo de cada uno y un solo botón.
 */

import { Datos } from './data.js';
import { Sesion } from './sesion.js';
import { escapar } from './ui.js';

export function vistaRegistro() {
  const yaDentro = Sesion.actual();

  const html = `
    <main class="principal"><div class="contenedor contenedor--estrecho">
      <div class="acceso">
        <div class="acceso__marca">
          <img src="assets/img/escudo.png" width="76" height="76"
               alt="Escudo de la Liga de Fútbol Amateur Fugaz">
        </div>

        <h1 class="acceso__titulo">Crear la cuenta de mi club</h1>
        <p class="acceso__sub">Se hace una sola vez. Luego entras con tu usuario y contraseña.</p>

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
          <label class="campo__etiqueta" for="r-club">Nombre del club</label>
          <input class="entrada" id="r-club" maxlength="40" placeholder="Deportivo Los Álamos">
          <span class="campo__ayuda">Como quieres que aparezca en la tabla.</span>
        </div>

        <div class="campo" style="margin-top:14px">
          <label class="campo__etiqueta" for="r-dirigente">Tu nombre y apellido</label>
          <input class="entrada" id="r-dirigente" maxlength="60" placeholder="Juan Pérez">
          <span class="campo__ayuda">La persona responsable del club.</span>
        </div>

        <div class="campo" style="margin-top:14px">
          <label class="campo__etiqueta" for="r-telefono">Teléfono</label>
          <input class="entrada" id="r-telefono" inputmode="tel" maxlength="20" placeholder="0991234567">
          <span class="campo__ayuda">Para que la organización pueda avisarte.</span>
        </div>

        <hr class="separador">

        <div class="campo">
          <label class="campo__etiqueta" for="r-usuario">Usuario</label>
          <input class="entrada" id="r-usuario" autocapitalize="none" spellcheck="false"
                 maxlength="20" placeholder="losalamos">
          <span class="campo__ayuda">Sin espacios ni acentos. Es con lo que entrarás.</span>
        </div>

        <div class="campo" style="margin-top:14px">
          <label class="campo__etiqueta" for="r-clave">Contraseña</label>
          <div class="campo-clave">
            <input class="entrada" id="r-clave" type="password" maxlength="40" placeholder="••••••">
            <button type="button" class="boton boton--secundario boton--chico" id="btn-ver-clave">Ver</button>
          </div>
          <span class="campo__ayuda">Al menos 4 caracteres. Apúntala donde no se te pierda.</span>
        </div>

        <div id="msj-registro"></div>

        <button class="boton boton--ancho" id="btn-crear" style="margin-top:20px">
          Crear mi cuenta
        </button>

        <p class="acceso__pie">
          ¿Ya tienes cuenta? <a href="#/entrar">Entrar</a>
        </p>
      </div>
    </div></main>`;

  function activar(raiz, navegar) {
    const $ = (s) => raiz.querySelector(s);

    const avisar = (texto, tipo = 'error') => {
      $('#msj-registro').innerHTML = texto
        ? `<div class="aviso aviso--${tipo}" style="margin:16px 0 0">
             <span class="aviso__icono">${tipo === 'error' ? '⚠️' : '✅'}</span>
             <div>${escapar(texto)}</div></div>`
        : '';
    };

    $('#btn-ver-clave').addEventListener('click', () => {
      const campo = $('#r-clave');
      const oculto = campo.type === 'password';
      campo.type = oculto ? 'text' : 'password';
      $('#btn-ver-clave').textContent = oculto ? 'Ocultar' : 'Ver';
    });

    // Propone un usuario a partir del nombre del club, para no hacer pensar.
    $('#r-club').addEventListener('blur', () => {
      if ($('#r-usuario').value.trim()) return;
      const sugerido = $('#r-club').value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')   // fuera acentos
        .replace(/^(cd|cf|ad|club|deportivo|real|sporting|racing|union|atletico)\s+/, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);
      if (sugerido.length >= 4) $('#r-usuario').value = sugerido;
    });

    $('#btn-crear').addEventListener('click', async () => {
      const revision = await Sesion.crearCuenta({
        club: $('#r-club').value,
        dirigente: $('#r-dirigente').value,
        telefono: $('#r-telefono').value,
        usuario: $('#r-usuario').value,
        clave: $('#r-clave').value,
      });
      if (!revision.ok) return avisar(revision.motivo);

      const { nombreClub, nombreDir, telefono, user, pass } = revision.datos;

      const alta = await Datos.registrarClub({
        nombre: nombreClub,
        dirigente: { nombre: nombreDir, telefono },
      });
      if (!alta.ok) return avisar(alta.motivo);

      await Sesion.registrarAcceso(alta.club, { user, pass, nombreDir });
      navegar('#/inscripcion');
    });

    raiz.querySelectorAll('.entrada').forEach((campo) => {
      campo.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') $('#btn-crear').click();
      });
    });

    $('#r-club').focus();
  }

  return { html, activar };
}
