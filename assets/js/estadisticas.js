/**
 * Estadísticas del campeonato.
 *
 * Todo lo de aquí sale de los partidos. Nada se guarda: si cambia un
 * resultado, cambian todos estos números solos.
 */

import { Datos } from './data.js';
import { escapar, escudo, nombreJugador } from './ui.js';
import { calcularClasificacion, calcularGoleadores } from './liga.js';

function tarjetaDestacado(etiqueta, valor, detalle, adorno = '') {
  return `
    <div class="destacado-tarjeta revelar">
      <span class="destacado-tarjeta__etiqueta">${escapar(etiqueta)}</span>
      <div class="destacado-tarjeta__valor">${adorno}${valor}</div>
      <span class="destacado-tarjeta__detalle">${detalle}</span>
    </div>`;
}

function bloqueVacio() {
  return `
    <main class="principal"><div class="contenedor">
      <section class="seccion">
        <div class="seccion__cabecera">
          <h1 class="seccion__titulo">Estadísticas</h1>
        </div>
        <div class="tarjeta"><div class="vacio">
          <div class="vacio__icono">📊</div>
          <p><strong>Todavía no hay partidos jugados.</strong></p>
          <p class="seccion__nota" style="max-width:44ch;margin:8px auto 0">
            En cuanto cargues el primer resultado aparecerán aquí la tabla de goleadores,
            los equipos más goleadores, las mejores defensas, las rachas y el resto de
            números del campeonato. Se calculan solos a partir de los partidos.
          </p>
        </div></div>
      </section>
    </div></main>`;
}

export function vistaEstadisticas() {
  const clubes = Datos.getEquipos();
  const partidos = Datos.getPartidos();
  const jugadores = Datos.getJugadores();
  const torneo = Datos.getTorneo();

  const jugados = partidos.filter((p) => p.estado === 'jugado');
  if (!jugados.length) return { html: bloqueVacio() };

  const clasificacion = calcularClasificacion(clubes, partidos, torneo);
  const goleadores = calcularGoleadores(jugadores, clubes, partidos);

  const totalGoles = jugados.reduce((s, p) => s + p.golesLocal + p.golesVisitante, 0);
  const media = (totalGoles / jugados.length).toFixed(2);

  const masGoleador = [...clasificacion].sort((a, b) => b.golesFavor - a.golesFavor)[0];
  const mejorDefensa = [...clasificacion].sort((a, b) => a.golesContra - b.golesContra)[0];
  const pichichi = goleadores[0] || null;

  const goleadas = [...jugados]
    .map((p) => ({ p, dif: Math.abs(p.golesLocal - p.golesVisitante) }))
    .sort((a, b) => b.dif - a.dif)[0];

  const porterias = clasificacion
    .map((f) => ({
      equipo: f.equipo,
      vallas: jugados.filter(
        (p) =>
          (p.localId === f.equipo.id && p.golesVisitante === 0) ||
          (p.visitanteId === f.equipo.id && p.golesLocal === 0)
      ).length,
    }))
    .sort((a, b) => b.vallas - a.vallas)
    .slice(0, 5);

  const rachaViva = [...clasificacion]
    .map((f) => {
      let seguidas = 0;
      for (let i = f.racha.length - 1; i >= 0 && f.racha[i] === 'G'; i--) seguidas++;
      return { equipo: f.equipo, seguidas };
    })
    .sort((a, b) => b.seguidas - a.seguidas)[0];

  const maxGoles = goleadores[0]?.goles || 1;

  const html = `
    <main class="principal"><div class="contenedor">

      <section class="seccion">
        <div class="seccion__cabecera">
          <h1 class="seccion__titulo">Estadísticas</h1>
          <span class="seccion__nota">${jugados.length} partidos · ${totalGoles} goles</span>
        </div>

        <div class="destacados">
          ${
            pichichi
              ? tarjetaDestacado(
                  'Máximo goleador',
                  escapar(nombreJugador(pichichi.jugador)),
                  `${pichichi.goles} goles · ${escapar(pichichi.equipo?.nombre || '')}`
                )
              : ''
          }
          ${tarjetaDestacado('Ataque más fuerte', escapar(masGoleador.equipo.nombre),
              `${masGoleador.golesFavor} goles a favor`)}
          ${tarjetaDestacado('Defensa más sólida', escapar(mejorDefensa.equipo.nombre),
              `solo ${mejorDefensa.golesContra} goles encajados`)}
          ${tarjetaDestacado('Goles por partido', media, `${totalGoles} en ${jugados.length} partidos`)}
          ${
            rachaViva && rachaViva.seguidas > 1
              ? tarjetaDestacado('Racha viva', escapar(rachaViva.equipo.nombre),
                  `${rachaViva.seguidas} victorias seguidas`)
              : ''
          }
          ${
            goleadas
              ? tarjetaDestacado(
                  'Resultado más abultado',
                  `${goleadas.p.golesLocal}–${goleadas.p.golesVisitante}`,
                  `${escapar(Datos.getEquipo(goleadas.p.localId)?.nombre || '')} vs ${escapar(
                    Datos.getEquipo(goleadas.p.visitanteId)?.nombre || ''
                  )}`
                )
              : ''
          }
        </div>
      </section>

      <div class="dos-columnas">
        <section class="seccion">
          <div class="seccion__cabecera">
            <h2 class="seccion__titulo">Goleadores</h2>
            <a class="seccion__nota" href="#/goleadores">Ver tabla completa →</a>
          </div>
          <div class="tarjeta">
            ${goleadores
              .slice(0, 10)
              .map(
                (g) => `
              <div class="nomina-fila">
                <span class="medalla medalla--${g.posicion <= 3 ? g.posicion : 'n'}">${g.posicion}</span>
                <div class="nomina-datos">
                  <div class="nomina-nombre">${escapar(nombreJugador(g.jugador))}</div>
                  <div class="nomina-meta">${escapar(g.equipo?.nombre || '')}</div>
                  <div class="barra-fina">
                    <span style="width:${Math.round((g.goles / maxGoles) * 100)}%"></span>
                  </div>
                </div>
                <span class="cifra">${g.goles}</span>
              </div>`
              )
              .join('')}
          </div>
        </section>

        <section class="seccion">
          <div class="seccion__cabecera">
            <h2 class="seccion__titulo">Porterías a cero</h2>
            <span class="seccion__nota">partidos sin encajar</span>
          </div>
          <div class="tarjeta">
            ${porterias
              .map(
                (v) => `
              <a class="nomina-fila" href="#/equipo/${escapar(v.equipo.id)}">
                ${escudo(v.equipo)}
                <div class="nomina-datos">
                  <div class="nomina-nombre">${escapar(v.equipo.nombre)}</div>
                </div>
                <span class="cifra">${v.vallas}</span>
              </a>`
              )
              .join('')}
          </div>
        </section>
      </div>

    </div></main>`;

  return { html };
}
