/**
 * Portada pública.
 *
 * Lo primero que ve alguien que llega sin conocer la plataforma: qué hace,
 * cómo funciona y qué obtiene. Las animaciones son adorno: si no se ejecutan,
 * la página se lee exactamente igual.
 */

import { Datos } from './data.js';
import { Sesion } from './sesion.js';
import { escapar } from './ui.js';
import { maquinaDeEscribir } from './animaciones.js';

const FRASES = [
  'sin planillas de papel',
  'sin cadenas de WhatsApp',
  'sin hojas de Excel',
  'sin discutir la tabla',
];

function paso(n, titulo, texto) {
  return `
    <div class="paso-guia revelar">
      <span class="paso-guia__numero">${n}</span>
      <div>
        <h3 class="paso-guia__titulo">${escapar(titulo)}</h3>
        <p class="paso-guia__texto">${escapar(texto)}</p>
      </div>
    </div>`;
}

function ventaja(icono, titulo, texto) {
  return `
    <div class="ventaja revelar">
      <span class="ventaja__icono" aria-hidden="true">${icono}</span>
      <h3 class="ventaja__titulo">${escapar(titulo)}</h3>
      <p class="ventaja__texto">${escapar(texto)}</p>
    </div>`;
}

export function vistaPortada() {
  const sesion = Sesion.actual();
  const torneos = Datos.getTorneos();
  const categorias = Datos.getCategorias();

  const accion = !sesion
    ? `<a class="boton boton--grande" href="#/entrar">Entrar</a>
       <a class="boton boton--fantasma boton--grande" href="#/planes">Ver planes</a>`
    : sesion.rol === 'dirigente'
    ? `<a class="boton boton--grande" href="#/inscripcion">Ir a mi club</a>`
    : Sesion.tieneMembresiaActiva()
    ? `<a class="boton boton--grande" href="#/organizador">Ir a mi panel</a>`
    : `<a class="boton boton--grande" href="#/planes">Activar mi membresía</a>`;

  const html = `
    <section class="heroe">
      <div class="heroe__fondo" data-parallax="0.18" aria-hidden="true"></div>
      <div class="heroe__resplandor" data-parallax="0.32" aria-hidden="true"></div>

      <div class="contenedor heroe__interior">
        <div class="heroe__texto">
          <span class="hero__etiqueta">Gestión de torneos de fútbol amateur</span>

          <h1 class="heroe__titulo">
            Organiza tu campeonato<br>
            <span class="heroe__variable" id="frase-rotativa">${escapar(FRASES[0])}</span>
          </h1>

          <p class="heroe__texto-apoyo">
            Abres las categorías, pones la fecha límite y cada club carga su propia
            nómina desde el móvil. La clasificación, los goleadores y el calendario
            se calculan solos a partir de los resultados.
          </p>

          <div class="heroe__acciones">${accion}</div>
          <p class="heroe__nota">Los clubes se inscriben gratis. Solo paga quien organiza.</p>
        </div>

        <div class="heroe__escudo" data-parallax="-0.06" aria-hidden="true">
          <img src="assets/img/escudo.png" width="300" height="300" alt="">
        </div>
      </div>

      <div class="heroe__cifras">
        <div class="contenedor cifras">
          <div class="cifra-bloque revelar">
            <span class="cifra-bloque__valor"><span data-contar="${categorias.length}">${categorias.length}</span></span>
            <span class="cifra-bloque__etiqueta">Categorías listas</span>
          </div>
          <div class="cifra-bloque revelar">
            <span class="cifra-bloque__valor">Sub-8<span class="cifra-bloque__a">a</span>Sub-40</span>
            <span class="cifra-bloque__etiqueta">Rango de edades</span>
          </div>
          <div class="cifra-bloque revelar">
            <span class="cifra-bloque__valor"><span data-contar="${torneos.length}">${torneos.length}</span></span>
            <span class="cifra-bloque__etiqueta">Torneos abiertos</span>
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
            <h2 class="seccion__titulo">Cómo funciona</h2>
            <span class="seccion__nota">Del anuncio del torneo al primer partido</span>
          </div>
          <div class="guia">
            ${paso(1, 'Creas el torneo', 'Le pones nombre, eliges modalidad y abres las categorías que necesites, de Sub-8 a Sub-40.')}
            ${paso(2, 'Fijas la fecha límite', 'Cada categoría cierra el día que tú digas. Pasada esa fecha nadie añade ni quita jugadores.')}
            ${paso(3, 'Cada club carga su nómina', 'Registras el club y le das su acceso. Su dirigente inscribe a los jugadores con nombre, edad y cédula.')}
            ${paso(4, 'Empieza a rodar la pelota', 'Cargas los resultados y la tabla, los goleadores y las rachas se actualizan al instante.')}
          </div>
        </section>

        <section class="seccion">
          <div class="seccion__cabecera revelar">
            <h2 class="seccion__titulo">Lo que te quitas de encima</h2>
          </div>
          <div class="ventajas">
            ${ventaja('⏳', 'El plazo se cumple solo', 'La fecha límite la pones tú y la web la hace respetar. Nadie mete un jugador a última hora.')}
            ${ventaja('🪪', 'Sin fichas repetidas', 'Si una cédula ya está inscrita en otro club de la misma categoría, no pasa.')}
            ${ventaja('🧒', 'Cada uno en su edad', 'Un chico de 15 no entra en Sub-12. La categoría se controla al cargar la nómina.')}
            ${ventaja('📊', 'Tablas que no se discuten', 'Clasificación y goleadores salen de los resultados. No hay dos versiones distintas.')}
            ${ventaja('📱', 'Pensada para el móvil', 'Los dirigentes cargan su nómina desde el teléfono, sin instalar nada.')}
            ${ventaja('🌐', 'Página pública', 'Jugadores y familias consultan la tabla y el calendario sin necesidad de cuenta.')}
          </div>
        </section>

        <section class="seccion">
          <div class="seccion__cabecera revelar">
            <h2 class="seccion__titulo">Los números del campeonato, solos</h2>
            <a class="seccion__nota" href="#/estadisticas">Ver estadísticas →</a>
          </div>
          <div class="muestra revelar">
            <div class="muestra__fila">
              <span class="muestra__punto"></span>
              <div><strong>Tabla de posiciones</strong> con puntos, diferencia de goles y racha de los últimos cinco partidos.</div>
            </div>
            <div class="muestra__fila">
              <span class="muestra__punto"></span>
              <div><strong>Goleadores</strong> del torneo, con su club y su promedio.</div>
            </div>
            <div class="muestra__fila">
              <span class="muestra__punto"></span>
              <div><strong>Ataque y defensa</strong>: quién marca más y quién menos encaja.</div>
            </div>
            <div class="muestra__fila">
              <span class="muestra__punto"></span>
              <div><strong>Porterías a cero</strong>, rachas de victorias y el resultado más abultado.</div>
            </div>
            <p class="muestra__pie">
              Nada de esto se escribe a mano: se recalcula cada vez que cargas un resultado.
            </p>
          </div>
        </section>

        <section class="seccion">
          <div class="seccion__cabecera revelar">
            <h2 class="seccion__titulo">Para quién es</h2>
          </div>
          <div class="dos-columnas">
            <div class="tarjeta revelar">
              <div class="tarjeta__titulo">Organizas un torneo</div>
              <div class="tarjeta__cuerpo">
                <p class="tarjeta__parrafo">
                  Creas los torneos, abres las categorías, pones los plazos, registras los
                  clubes y ves todas las nóminas. Requiere membresía.
                </p>
                <div class="acciones" style="border:0;padding-top:14px">
                  <a class="boton" href="#/planes">Ver planes</a>
                </div>
              </div>
            </div>
            <div class="tarjeta revelar">
              <div class="tarjeta__titulo">Diriges un club</div>
              <div class="tarjeta__cuerpo">
                <p class="tarjeta__parrafo">
                  Inscribes a tu club y cargas la nómina antes de que cierre el plazo.
                  <strong>Es gratis</strong>: la organización del torneo te da el acceso.
                </p>
                <div class="acciones" style="border:0;padding-top:14px">
                  <a class="boton boton--secundario" href="#/entrar">Entrar</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="cierre revelar">
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
