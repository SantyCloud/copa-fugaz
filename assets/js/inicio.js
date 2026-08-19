/**
 * Portada pública.
 *
 * El protagonista es el campeonato del cliente, no la plataforma. Quien llega
 * viene a ver los torneos de la Copa Fugaz y a inscribir su club; lo de
 * contratar una membresía para organizar torneos propios existe, pero vive en
 * el pie, no aquí.
 *
 * Las animaciones son adorno: si no se ejecutan, la página se lee igual.
 */

import { Datos } from './data.js';
import { Sesion } from './sesion.js';
import { escapar } from './ui.js';
import { maquinaDeEscribir } from './animaciones.js';
import { Iconos } from './iconos.js';

/** Se rellena con los torneos reales al pintar la portada. */
const FRASES_POR_DEFECTO = ['Copa Fugaz'];

function paso(n, color, titulo, texto) {
  return `
    <div class="paso-guia revelar" style="--acento:var(--ldfaf-${color})">
      <span class="paso-guia__numero">${n}</span>
      <h3 class="paso-guia__titulo">${escapar(titulo)}</h3>
      <p class="paso-guia__texto">${escapar(texto)}</p>
    </div>`;
}

/**
 * Maqueta de la aplicación para el héroe.
 * Es HTML y CSS, no una imagen: pesa nada y se ve nítida en cualquier pantalla.
 */
function maquetaApp() {
  const equipos = [
    { p: 1, ab: 'ARI', n: 'Atlético Riberas', pj: 5, pts: 12, c: 'verde' },
    { p: 2, ab: 'VAL', n: 'CD Valdehierro', pj: 5, pts: 10, c: 'azul' },
    { p: 3, ab: 'MOL', n: 'CF Molinos', pj: 5, pts: 9, c: 'morado' },
    { p: 4, ab: 'TOR', n: 'AD Torrecilla', pj: 5, pts: 7, c: 'rojo' },
  ];

  return `
    <div class="maqueta" aria-hidden="true">
      <div class="maqueta__barra">
        <span class="maqueta__punto"></span>
        <span class="maqueta__punto"></span>
        <span class="maqueta__punto"></span>
        <span class="maqueta__ruta">liga · clasificación</span>
      </div>

      <div class="maqueta__cuerpo">
        <div class="maqueta__cabecera">
          <span class="maqueta__titulo">Copa Fugaz Fútbol 11</span>
          <span class="maqueta__insignia">Sub-16</span>
        </div>

        ${equipos
          .map(
            (e) => `
          <div class="maqueta__fila">
            <span class="maqueta__pos ${e.p === 1 ? 'maqueta__pos--lider' : ''}">${e.p}</span>
            <span class="maqueta__escudo" style="background:var(--ldfaf-${e.c})">${e.ab}</span>
            <span class="maqueta__nombre">${e.n}</span>
            <span class="maqueta__pj">${e.pj}</span>
            <span class="maqueta__pts">${e.pts}</span>
          </div>`
          )
          .join('')}

        <div class="maqueta__pie">
          <span class="maqueta__chispa"></span>
          Actualizado al cargar el resultado
        </div>
      </div>
    </div>

    <div class="tarjeta-flotante" aria-hidden="true">
      <span class="tarjeta-flotante__icono">${Iconos.cedula(18)}</span>
      <div>
        <span class="tarjeta-flotante__titulo">Nómina enviada</span>
        <span class="tarjeta-flotante__texto">18 jugadores · Sub-16</span>
      </div>
    </div>`;
}


/**
 * Torneos con sus categorías y el estado del plazo.
 * Es el contenido principal de la portada: quien llega quiere ver dónde
 * puede inscribirse, no que le vendan nada.
 */
function listaTorneos(torneos) {
  if (!torneos.length) {
    return `<div class="tarjeta"><div class="vacio">
      <div class="vacio__icono">🏆</div>
      <p><strong>Todavía no hay torneos publicados.</strong></p>
    </div></div>`;
  }

  return torneos
    .map((t) => {
      const cats = t.categorias
        .map((c) => {
          const plazo = Datos.plazoAbierto(c);
          const pronto = plazo.abierto && plazo.dias <= 7;
          const estado = !plazo.abierto ? 'cerrada' : pronto ? 'pronto' : 'abierta';
          const detalle = !plazo.abierto
            ? 'Plazo cerrado'
            : plazo.dias <= 0
            ? 'Último día'
            : `Quedan ${plazo.dias} día${plazo.dias === 1 ? '' : 's'}`;

          const cuerpo = `
            <span class="categoria-ficha__nombre">${escapar(c.nombre)}</span>
            <span class="categoria-ficha__edad">${
              c.edadMaxima != null ? `hasta ${c.edadMaxima} años` : 'sin límite'
            }</span>
            <span class="categoria-ficha__plazo">${escapar(detalle)}</span>`;

          return plazo.abierto
            ? `<a class="categoria-ficha categoria-ficha--${estado}" href="#/registro">${cuerpo}</a>`
            : `<span class="categoria-ficha categoria-ficha--${estado}">${cuerpo}</span>`;
        })
        .join('');

      const abiertas = t.categorias.filter((c) => Datos.plazoAbierto(c).abierto).length;

      return `
        <div class="torneo-tarjeta revelar">
          <div class="torneo-tarjeta__cabecera">
            <span class="torneo-tarjeta__icono">${Iconos.trofeo(20)}</span>
            <div>
              <h3 class="torneo-tarjeta__nombre">${escapar(t.nombre)}</h3>
              <span class="torneo-tarjeta__meta">${escapar(t.modalidad)} ·
                ${abiertas} de ${t.categorias.length} categorías abiertas</span>
            </div>
          </div>
          <div class="categorias-rejilla">${cats}</div>
        </div>`;
    })
    .join('');
}

export function vistaPortada() {
  const sesion = Sesion.actual();
  const torneos = Datos.getTorneos();
  const categorias = Datos.getCategorias();
  const clubes = Datos.getClubes();
  const abiertas = categorias.filter((c) => Datos.plazoAbierto(c).abierto);

  // El titular gira los nombres de los torneos del cliente.
  const frases = torneos.length
    ? torneos.map((t) => t.nombre.replace(/^Copa Fugaz\s*/i, '') || t.nombre)
    : FRASES_POR_DEFECTO;

  const accion = !sesion
    ? `<div class="heroe__botones">
         <a class="boton boton--grande" href="#/registro">Inscribir mi club</a>
         <button type="button" class="boton boton--fantasma boton--grande" id="btn-ver-torneos">Ver los torneos</button>
       </div>`
    : sesion.rol === 'dirigente'
    ? `<div class="heroe__botones"><a class="boton boton--grande" href="#/inscripcion">Ir a mi club</a></div>`
    : `<div class="heroe__botones"><a class="boton boton--grande" href="#/organizador">Ir a mi panel</a></div>`;

  // Cinta con las categorías, duplicada para que el bucle no tenga costura.
  const nombresCat = [...new Set(categorias.map((c) => c.nombre))];
  const cinta = [...nombresCat, ...nombresCat]
    .map((n) => `<span class="cinta__item">${escapar(n)}</span>`)
    .join('');

  const html = `
    <section class="heroe">
      <div class="heroe__malla" data-parallax="0.16" aria-hidden="true"></div>
      <div class="heroe__resplandor" data-parallax="0.3" aria-hidden="true"></div>

      <div class="contenedor heroe__interior">
        <div class="heroe__texto">
          <span class="hero__etiqueta">
            ${Iconos.trofeo(13)} Temporada 2026 · Inscripciones abiertas
          </span>

          <h1 class="heroe__titulo">
            Copa Fugaz
            <span class="heroe__linea">
              <span class="heroe__variable" id="frase-rotativa">${escapar(frases[0])}</span>
            </span>
          </h1>

          <p class="heroe__texto-apoyo">
            ${abiertas.length} ${abiertas.length === 1 ? 'categoría' : 'categorías'} con la
            inscripción abierta, de Sub-8 a Sub-40. Inscribe a tu club y carga tu nómina
            desde el móvil.
          </p>

          ${accion}

          <ul class="heroe__sellos">
            <li>${Iconos.personas(15)} Inscribir tu club es gratis</li>
            <li>${Iconos.movil(15)} Se hace desde el teléfono</li>
            <li>${Iconos.reloj(15)} Solo hasta la fecha límite</li>
          </ul>
        </div>

        <div class="heroe__maqueta" data-parallax="-0.05">
          ${maquetaApp()}
        </div>
      </div>

      <div class="cinta" aria-hidden="true">
        <div class="cinta__pista">${cinta}</div>
      </div>

      <div class="heroe__cifras">
        <div class="contenedor cifras">
          <div class="cifra-bloque revelar" style="--acento:var(--ldfaf-verde)">
            <span class="cifra-bloque__valor"><span data-contar="${abiertas.length}">${abiertas.length}</span></span>
            <span class="cifra-bloque__etiqueta">${
              abiertas.length === 1 ? 'Categoría abierta' : 'Categorías abiertas'
            }</span>
          </div>
          <div class="cifra-bloque revelar" style="--acento:var(--ldfaf-azul)">
            <span class="cifra-bloque__valor">Sub-8<span class="cifra-bloque__a">→</span>Sub-40</span>
            <span class="cifra-bloque__etiqueta">Edades</span>
          </div>
          <div class="cifra-bloque revelar" style="--acento:var(--ldfaf-morado)">
            <span class="cifra-bloque__valor"><span data-contar="${torneos.length}">${torneos.length}</span></span>
            <span class="cifra-bloque__etiqueta">${torneos.length === 1 ? 'Torneo' : 'Torneos'}</span>
          </div>
          <div class="cifra-bloque revelar" style="--acento:var(--ldfaf-rojo)">
            <span class="cifra-bloque__valor"><span data-contar="${clubes.length}">${clubes.length}</span></span>
            <span class="cifra-bloque__etiqueta">${
              clubes.length === 1 ? 'Club inscrito' : 'Clubes inscritos'
            }</span>
          </div>
        </div>
      </div>
    </section>

    <main class="principal">
      <div class="contenedor">

        <section class="seccion" id="torneos">
          <div class="seccion__cabecera revelar">
            <div>
              <span class="seccion__ojo" style="--acento:var(--ldfaf-verde)">Inscripciones</span>
              <h2 class="seccion__titulo seccion__titulo--grande">Torneos y plazos</h2>
            </div>
            <span class="seccion__nota">Toca tu categoría para empezar</span>
          </div>
          ${listaTorneos(torneos)}
        </section>

        <section class="seccion">
          <div class="seccion__cabecera revelar">
            <div>
              <span class="seccion__ojo" style="--acento:var(--ldfaf-azul)">Paso a paso</span>
              <h2 class="seccion__titulo seccion__titulo--grande">Cómo inscribir tu club</h2>
            </div>
          </div>
          <div class="guia">
            ${paso(1, 'verde', 'Creas tu cuenta', 'El nombre de tu club, el tuyo y un teléfono. Se hace una sola vez.')}
            ${paso(2, 'azul', 'Eliges torneo y categoría', 'Fútbol 11 o Fútbol 7, y la categoría por edad que te toque.')}
            ${paso(3, 'morado', 'Cargas a tus jugadores', 'Nombre, apellidos, edad y número de cédula de cada uno.')}
          </div>
        </section>

        <section class="seccion">
          <div class="franja revelar">
            <div class="franja__texto">
              <span class="seccion__ojo" style="--acento:var(--ldfaf-rojo)">La liga</span>
              <h2 class="seccion__titulo seccion__titulo--grande">Sigue el campeonato</h2>
              <p class="franja__parrafo">
                Tabla, calendario y goleadores, sin necesidad de tener cuenta.
              </p>
              <div class="heroe__botones" style="margin-top:0">
                <a class="boton boton--secundario" href="#/liga">Ver la tabla</a>
                <a class="boton boton--fantasma" href="#/estadisticas">Estadísticas</a>
              </div>
            </div>
            <ul class="franja__lista">
              <li>${Iconos.tabla(18)} Posiciones, puntos y racha</li>
              <li>${Iconos.balon(18)} Goleadores del torneo</li>
              <li>${Iconos.calendario(18)} Calendario por jornadas</li>
            </ul>
          </div>
        </section>

        <section class="cierre revelar">
          <span class="cierre__escudo">${Iconos.balon(30)}</span>
          <h2 class="cierre__titulo">¿Listo para inscribir tu club?</h2>
          <p class="cierre__texto">
            ${abiertas.length === 1 ? 'Queda 1 categoría abierta' : `Quedan ${abiertas.length} categorías abiertas`}
            entre ${escapar(torneos.map((t) => t.nombre).join(' y '))}.
          </p>
          <div class="heroe__botones" style="justify-content:center">
            <a class="boton boton--grande" href="#/registro">Inscribir mi club</a>
          </div>
        </section>

      </div>
    </main>`;

  function activar(raiz) {
    maquinaDeEscribir(raiz.querySelector('#frase-rotativa'), frases);

    // No usamos un ancla porque el router ya se apropia del hash.
    raiz.querySelector('#btn-ver-torneos')?.addEventListener('click', () => {
      raiz.querySelector('#torneos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return { html, activar };
}
