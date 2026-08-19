/**
 * Portada pública — lo primero que ve alguien que llega sin conocer la web.
 *
 * Explica qué hace la plataforma, para quién es, y lleva a entrar o a los
 * planes. La liga en curso se enseña como ejemplo vivo de lo que se obtiene.
 */

import { Datos } from './data.js';
import { Sesion } from './sesion.js';
import { escapar, escudo } from './ui.js';
import { calcularClasificacion } from './liga.js';

function paso(numero, titulo, texto) {
  return `
    <div class="paso-guia">
      <span class="paso-guia__numero">${numero}</span>
      <div>
        <h3 class="paso-guia__titulo">${escapar(titulo)}</h3>
        <p class="paso-guia__texto">${escapar(texto)}</p>
      </div>
    </div>`;
}

function ventaja(icono, titulo, texto) {
  return `
    <div class="ventaja">
      <span class="ventaja__icono" aria-hidden="true">${icono}</span>
      <h3 class="ventaja__titulo">${escapar(titulo)}</h3>
      <p class="ventaja__texto">${escapar(texto)}</p>
    </div>`;
}

export function vistaPortada() {
  const torneo = Datos.getTorneo();
  const clubes = Datos.getClubes();
  const categorias = Datos.getCategorias();
  const abiertas = categorias.filter((c) => Datos.plazoAbierto(c).abierto);
  const jugadores = Datos.getJugadores().length;
  const sesion = Sesion.actual();

  const clasificacion = calcularClasificacion(clubes, Datos.getPartidos(), torneo);
  const podio = clasificacion.slice(0, 3);

  // A dónde mandamos al visitante según quién sea.
  const accionPrincipal = !sesion
    ? `<a class="boton boton--grande" href="#/entrar">Entrar</a>
       <a class="boton boton--secundario boton--grande" href="#/planes">Ver planes</a>`
    : sesion.rol === 'dirigente'
    ? `<a class="boton boton--grande" href="#/inscripcion">Ir a mi club</a>`
    : Sesion.tieneMembresiaActiva()
    ? `<a class="boton boton--grande" href="#/organizador">Ir a mi panel</a>`
    : `<a class="boton boton--grande" href="#/planes">Activar mi membresía</a>`;

  const html = `
    <section class="portada">
      <div class="contenedor portada__interior">
        <span class="hero__etiqueta">Gestión de torneos de fútbol amateur</span>
        <h1 class="portada__titulo">
          Tu campeonato,<br>organizado sin<br><em>papeles ni grupos de WhatsApp</em>
        </h1>
        <p class="portada__texto">
          Los dirigentes inscriben a sus jugadores desde el móvil. Tú pones la fecha
          límite y la web se encarga del resto: nóminas, cédulas, categorías por edad,
          calendario, clasificación y goleadores.
        </p>
        <div class="portada__acciones">${accionPrincipal}</div>
        <p class="portada__nota">Los clubes se inscriben gratis. Solo paga quien organiza.</p>
      </div>
    </section>

    <main class="principal">
      <div class="contenedor">

        <section class="seccion">
          <div class="seccion__cabecera">
            <h2 class="seccion__titulo">Cómo funciona</h2>
            <span class="seccion__nota">Del anuncio del torneo al primer partido</span>
          </div>
          <div class="guia">
            ${paso(1, 'Creas el torneo', 'Le pones nombre, eliges la modalidad y abres las categorías que quieras, desde Sub-8 hasta Sub-40.')}
            ${paso(2, 'Fijas la fecha límite', 'Cada categoría cierra el día que tú digas. Pasada esa fecha, nadie puede añadir ni quitar jugadores.')}
            ${paso(3, 'Los clubes cargan su nómina', 'Cada dirigente entra con su cuenta y registra a sus jugadores con nombre, edad y cédula. La web rechaza a quien no cumple la edad o ya está inscrito en otro club.')}
            ${paso(4, 'Empieza a rodar la pelota', 'Cargas los resultados y la clasificación, el calendario y la tabla de goleadores se actualizan solos.')}
          </div>
        </section>

        <section class="seccion">
          <div class="seccion__cabecera">
            <h2 class="seccion__titulo">Lo que te ahorra</h2>
          </div>
          <div class="ventajas">
            ${ventaja('📅', 'Se acabó el plazo, se acabó', 'La fecha límite la pones tú y la web la hace cumplir. Nadie mete un jugador a última hora.')}
            ${ventaja('🪪', 'Sin fichas repetidas', 'Si una cédula ya está inscrita en otro club de la misma categoría, la web no la deja pasar.')}
            ${ventaja('👶', 'Cada uno en su edad', 'Un chico de 15 no entra en Sub-12. La categoría se controla sola al cargar la nómina.')}
            ${ventaja('📊', 'Tablas que no se pelean', 'La clasificación y los goleadores salen de los resultados. No hay dos versiones distintas.')}
            ${ventaja('📱', 'Hecha para el móvil', 'Los dirigentes cargan su nómina desde el teléfono, sin instalar nada.')}
            ${ventaja('🌐', 'Página pública', 'Jugadores y familias consultan la tabla y el calendario sin necesidad de cuenta.')}
          </div>
        </section>

        <section class="seccion">
          <div class="seccion__cabecera">
            <h2 class="seccion__titulo">Para quién es</h2>
          </div>
          <div class="dos-columnas">
            <div class="tarjeta">
              <div class="tarjeta__titulo">Organizas un torneo</div>
              <div class="tarjeta__cuerpo">
                <p style="color:var(--texto-medio);font-size:.9rem">
                  Creas los torneos, abres las categorías, pones los plazos y ves quién se
                  ha inscrito. Necesitas una membresía.
                </p>
                <div class="acciones" style="border:0;padding-top:14px">
                  <a class="boton" href="#/planes">Ver planes</a>
                </div>
              </div>
            </div>
            <div class="tarjeta">
              <div class="tarjeta__titulo">Diriges un club</div>
              <div class="tarjeta__cuerpo">
                <p style="color:var(--texto-medio);font-size:.9rem">
                  Inscribes a tu club y cargas la nómina de tus jugadores antes de que
                  cierre el plazo. <strong>Es gratis</strong>: el organizador del torneo te
                  da el acceso.
                </p>
                <div class="acciones" style="border:0;padding-top:14px">
                  <a class="boton boton--secundario" href="#/entrar">Entrar como dirigente</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="seccion">
          <div class="seccion__cabecera">
            <h2 class="seccion__titulo">Una liga funcionando ahora mismo</h2>
            <a class="seccion__nota" href="#/liga">Ver la liga completa →</a>
          </div>
          <div class="tarjeta">
            <div class="tarjeta__titulo">${escapar(torneo.nombre)} · ${escapar(torneo.descripcion)}</div>
            <div class="hero__stats" style="padding:14px;margin:0">
              <div class="stat"><div class="stat__valor">${clubes.length}</div><div class="stat__etiqueta">Clubes</div></div>
              <div class="stat"><div class="stat__valor">${jugadores}</div><div class="stat__etiqueta">Jugadores</div></div>
              <div class="stat"><div class="stat__valor">${categorias.length}</div><div class="stat__etiqueta">Categorías</div></div>
              <div class="stat"><div class="stat__valor">${abiertas.length}</div><div class="stat__etiqueta">Plazos abiertos</div></div>
            </div>
            ${podio
              .map(
                (f) => `
              <a class="nomina-fila" href="#/equipo/${escapar(f.equipo.id)}">
                <span class="pos pos--${f.posicion}">${f.posicion}</span>
                ${escudo(f.equipo)}
                <div class="nomina-datos">
                  <div class="nomina-nombre">${escapar(f.equipo.nombre)}</div>
                  <div class="nomina-meta">${f.puntos} puntos · ${f.jugados} partidos</div>
                </div>
              </a>`
              )
              .join('')}
          </div>
        </section>

      </div>
    </main>`;

  return { html };
}
