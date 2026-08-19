/**
 * Portada pública.
 *
 * Enseña el producto, no solo lo cuenta: el héroe lleva una maqueta de la
 * aplicación real. Las animaciones son adorno; si no se ejecutan, la página
 * se lee exactamente igual.
 */

import { Datos } from './data.js';
import { Sesion } from './sesion.js';
import { escapar } from './ui.js';
import { maquinaDeEscribir } from './animaciones.js';
import { Iconos } from './iconos.js';

const FRASES = [
  'sin planillas de papel',
  'sin cadenas de WhatsApp',
  'sin hojas de cálculo',
  'sin discutir la tabla',
];

/* Los cinco colores del escudo, en orden, para dar ritmo a las secciones. */
const COLORES = ['verde', 'azul', 'morado', 'rojo', 'grafito'];

function paso(n, color, titulo, texto) {
  return `
    <div class="paso-guia revelar" style="--acento:var(--ldfaf-${color})">
      <span class="paso-guia__numero">${n}</span>
      <h3 class="paso-guia__titulo">${escapar(titulo)}</h3>
      <p class="paso-guia__texto">${escapar(texto)}</p>
    </div>`;
}

function ventaja(icono, color, titulo, texto) {
  return `
    <div class="ventaja revelar" style="--acento:var(--ldfaf-${color})">
      <span class="ventaja__icono">${icono}</span>
      <h3 class="ventaja__titulo">${escapar(titulo)}</h3>
      <p class="ventaja__texto">${escapar(texto)}</p>
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

export function vistaPortada() {
  const sesion = Sesion.actual();
  const torneos = Datos.getTorneos();
  const categorias = Datos.getCategorias();

  const accion = !sesion
    ? `<a class="boton boton--grande" href="#/entrar">Entrar al panel</a>
       <a class="boton boton--fantasma boton--grande" href="#/planes">Ver planes</a>`
    : sesion.rol === 'dirigente'
    ? `<a class="boton boton--grande" href="#/inscripcion">Ir a mi club</a>`
    : Sesion.tieneMembresiaActiva()
    ? `<a class="boton boton--grande" href="#/organizador">Ir a mi panel</a>`
    : `<a class="boton boton--grande" href="#/planes">Activar mi membresía</a>`;

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
            ${Iconos.trofeo(13)} Gestión de torneos de fútbol amateur
          </span>

          <h1 class="heroe__titulo">
            Organiza tu campeonato
            <span class="heroe__linea">
              <span class="heroe__variable" id="frase-rotativa">${escapar(FRASES[0])}</span>
            </span>
          </h1>

          <p class="heroe__texto-apoyo">
            Abres las categorías, pones la fecha límite y cada club carga su propia
            nómina desde el móvil. La clasificación, los goleadores y el calendario
            se calculan solos a partir de los resultados.
          </p>

          <div class="heroe__acciones">${accion}</div>

          <ul class="heroe__sellos">
            <li>${Iconos.rayo(15)} Listo en minutos</li>
            <li>${Iconos.personas(15)} Los clubes entran gratis</li>
            <li>${Iconos.movil(15)} Funciona en el móvil</li>
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
          <div class="cifra-bloque revelar">
            <span class="cifra-bloque__valor"><span data-contar="${categorias.length}">${categorias.length}</span></span>
            <span class="cifra-bloque__etiqueta">Categorías listas</span>
          </div>
          <div class="cifra-bloque revelar">
            <span class="cifra-bloque__valor">Sub-8<span class="cifra-bloque__a">→</span>Sub-40</span>
            <span class="cifra-bloque__etiqueta">Rango de edades</span>
          </div>
          <div class="cifra-bloque revelar">
            <span class="cifra-bloque__valor"><span data-contar="${torneos.length}">${torneos.length}</span></span>
            <span class="cifra-bloque__etiqueta">Torneos creados</span>
          </div>
          <div class="cifra-bloque revelar">
            <span class="cifra-bloque__valor">0</span>
            <span class="cifra-bloque__etiqueta">Planillas en papel</span>
          </div>
        </div>
      </div>
    </section>

    <main class="principal">
      <div class="contenedor">

        <section class="seccion">
          <div class="seccion__cabecera revelar">
            <div>
              <span class="seccion__ojo">Cómo funciona</span>
              <h2 class="seccion__titulo seccion__titulo--grande">Del anuncio del torneo<br>al primer partido</h2>
            </div>
          </div>
          <div class="guia">
            ${paso(1, 'verde', 'Creas el torneo', 'Le pones nombre, eliges modalidad y abres las categorías que necesites, de Sub-8 a Sub-40.')}
            ${paso(2, 'azul', 'Fijas la fecha límite', 'Cada categoría cierra el día que tú digas. Pasada esa fecha nadie añade ni quita jugadores.')}
            ${paso(3, 'morado', 'Cada club carga su nómina', 'Registras el club y le das su acceso. Su dirigente inscribe a los jugadores con nombre, edad y cédula.')}
            ${paso(4, 'rojo', 'Empieza a rodar la pelota', 'Cargas los resultados y la tabla, los goleadores y las rachas se actualizan al instante.')}
          </div>
        </section>

        <section class="seccion">
          <div class="seccion__cabecera revelar">
            <div>
              <span class="seccion__ojo">Ventajas</span>
              <h2 class="seccion__titulo seccion__titulo--grande">Lo que te quitas de encima</h2>
            </div>
          </div>
          <div class="ventajas">
            ${ventaja(Iconos.reloj(22), 'verde', 'El plazo se cumple solo', 'La fecha límite la pones tú y la web la hace respetar. Nadie mete un jugador a última hora.')}
            ${ventaja(Iconos.cedula(22), 'azul', 'Sin fichas repetidas', 'Si una cédula ya está inscrita en otro club de la misma categoría, no pasa.')}
            ${ventaja(Iconos.edad(22), 'morado', 'Cada uno en su edad', 'Un chico de 15 no entra en Sub-12. La categoría se controla al cargar la nómina.')}
            ${ventaja(Iconos.tabla(22), 'rojo', 'Tablas que no se discuten', 'Clasificación y goleadores salen de los resultados. No hay dos versiones distintas.')}
            ${ventaja(Iconos.movil(22), 'verde', 'Pensada para el móvil', 'Los dirigentes cargan su nómina desde el teléfono, sin instalar nada.')}
            ${ventaja(Iconos.globo(22), 'azul', 'Página pública', 'Jugadores y familias consultan la tabla y el calendario sin necesidad de cuenta.')}
          </div>
        </section>

        <section class="seccion">
          <div class="franja revelar">
            <div class="franja__texto">
              <span class="seccion__ojo">Estadísticas</span>
              <h2 class="seccion__titulo seccion__titulo--grande">Los números salen solos</h2>
              <p class="franja__parrafo">
                No se escribe nada a mano. Cada resultado que cargas recalcula la tabla,
                los goleadores y las rachas. Si corriges un marcador, todo se ajusta.
              </p>
              <a class="boton boton--secundario" href="#/estadisticas">Ver el apartado</a>
            </div>
            <ul class="franja__lista">
              <li>${Iconos.tabla(18)} Puntos, diferencia de goles y racha de los últimos cinco</li>
              <li>${Iconos.balon(18)} Tabla de goleadores con su club</li>
              <li>${Iconos.trofeo(18)} Ataque más fuerte y defensa más sólida</li>
              <li>${Iconos.candado(18)} Porterías a cero y rachas de victorias</li>
              <li>${Iconos.calendario(18)} Calendario por jornadas con hora y marcador</li>
            </ul>
          </div>
        </section>

        <section class="seccion">
          <div class="seccion__cabecera revelar">
            <div>
              <span class="seccion__ojo">Dos accesos</span>
              <h2 class="seccion__titulo seccion__titulo--grande">Para quién es</h2>
            </div>
          </div>
          <div class="dos-columnas">
            <div class="tarjeta-rol revelar" style="--acento:var(--ldfaf-verde)">
              <span class="tarjeta-rol__icono">${Iconos.trofeo(22)}</span>
              <h3 class="tarjeta-rol__titulo">Organizas un torneo</h3>
              <p class="tarjeta-rol__texto">
                Creas los torneos, abres las categorías, pones los plazos, registras los
                clubes y ves todas las nóminas.
              </p>
              <span class="tarjeta-rol__precio">Requiere membresía</span>
              <a class="boton boton--ancho" href="#/planes">Ver planes</a>
            </div>
            <div class="tarjeta-rol revelar" style="--acento:var(--ldfaf-azul)">
              <span class="tarjeta-rol__icono">${Iconos.personas(22)}</span>
              <h3 class="tarjeta-rol__titulo">Diriges un club</h3>
              <p class="tarjeta-rol__texto">
                Inscribes a tu club y cargas la nómina antes de que cierre el plazo.
                La organización del torneo te entrega el acceso.
              </p>
              <span class="tarjeta-rol__precio tarjeta-rol__precio--gratis">Gratis, siempre</span>
              <a class="boton boton--secundario boton--ancho" href="#/entrar">Entrar</a>
            </div>
          </div>
        </section>

        <section class="cierre revelar">
          <span class="cierre__escudo">${Iconos.balon(30)}</span>
          <h2 class="cierre__titulo">¿Arrancamos tu torneo?</h2>
          <p class="cierre__texto">
            ${escapar(torneos.map((t) => t.nombre).join(' y '))} ya están creados, con
            ${categorias.length} categorías listas para abrir inscripciones.
          </p>
          <div class="heroe__acciones" style="justify-content:center">
            <a class="boton boton--grande" href="#/entrar">Entrar al panel</a>
          </div>
        </section>

      </div>
    </main>`;

  function activar(raiz) {
    maquinaDeEscribir(raiz.querySelector('#frase-rotativa'), FRASES);
  }

  return { html, activar };
}
