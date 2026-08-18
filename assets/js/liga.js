/**
 * Cálculos del campeonato: tabla de posiciones, goleadores y estadísticas.
 *
 * Todo aquí es DERIVADO de los partidos. Nada se guarda.
 * Si un resultado cambia, la clasificación cambia sola y no hay forma de que
 * queden desincronizadas.
 */

/**
 * Construye la tabla de posiciones.
 * Desempates, en orden: puntos → diferencia de goles → goles a favor → alfabético.
 */
export function calcularClasificacion(equipos, partidos, torneo) {
  const pVictoria = torneo?.puntosVictoria ?? 3;
  const pEmpate = torneo?.puntosEmpate ?? 1;
  const pDerrota = torneo?.puntosDerrota ?? 0;

  const fila = new Map(
    equipos.map((e) => [
      e.id,
      {
        equipo: e,
        jugados: 0, ganados: 0, empatados: 0, perdidos: 0,
        golesFavor: 0, golesContra: 0, diferencia: 0, puntos: 0,
        racha: [], // 'G' | 'E' | 'P', del más antiguo al más reciente
      },
    ])
  );

  const jugados = partidos
    .filter((p) => p.estado === 'jugado')
    .sort((a, b) => a.jornada - b.jornada);

  for (const p of jugados) {
    const local = fila.get(p.localId);
    const visitante = fila.get(p.visitanteId);
    if (!local || !visitante) continue; // partido de un equipo que ya no existe

    local.jugados++; visitante.jugados++;
    local.golesFavor += p.golesLocal;   local.golesContra += p.golesVisitante;
    visitante.golesFavor += p.golesVisitante; visitante.golesContra += p.golesLocal;

    if (p.golesLocal > p.golesVisitante) {
      local.ganados++; local.puntos += pVictoria; local.racha.push('G');
      visitante.perdidos++; visitante.puntos += pDerrota; visitante.racha.push('P');
    } else if (p.golesLocal < p.golesVisitante) {
      visitante.ganados++; visitante.puntos += pVictoria; visitante.racha.push('G');
      local.perdidos++; local.puntos += pDerrota; local.racha.push('P');
    } else {
      local.empatados++; local.puntos += pEmpate; local.racha.push('E');
      visitante.empatados++; visitante.puntos += pEmpate; visitante.racha.push('E');
    }
  }

  const tabla = [...fila.values()];
  for (const f of tabla) {
    f.diferencia = f.golesFavor - f.golesContra;
    f.racha = f.racha.slice(-5);
  }

  tabla.sort(
    (a, b) =>
      b.puntos - a.puntos ||
      b.diferencia - a.diferencia ||
      b.golesFavor - a.golesFavor ||
      a.equipo.nombre.localeCompare(b.equipo.nombre, 'es')
  );

  tabla.forEach((f, i) => { f.posicion = i + 1; });
  return tabla;
}

/** Tabla de goleadores, de más a menos goles. */
export function calcularGoleadores(jugadores, equipos, partidos) {
  const porJugador = new Map();

  for (const p of partidos) {
    if (p.estado !== 'jugado') continue;
    for (const g of p.goleadores || []) {
      porJugador.set(g.jugadorId, (porJugador.get(g.jugadorId) || 0) + 1);
    }
  }

  const indiceJugador = new Map(jugadores.map((j) => [j.id, j]));
  const indiceEquipo = new Map(equipos.map((e) => [e.id, e]));

  const lista = [];
  for (const [jugadorId, goles] of porJugador) {
    const jugador = indiceJugador.get(jugadorId);
    if (!jugador) continue; // gol de un jugador borrado
    lista.push({ jugador, equipo: indiceEquipo.get(jugador.equipoId) || null, goles });
  }

  lista.sort(
    (a, b) =>
      b.goles - a.goles ||
      (a.jugador.nombreCompleto || a.jugador.nombre).localeCompare(
        b.jugador.nombreCompleto || b.jugador.nombre, 'es')
  );

  // Posición compartida entre jugadores con los mismos goles.
  let posicion = 0;
  let golesPrevios = null;
  lista.forEach((item, i) => {
    if (item.goles !== golesPrevios) {
      posicion = i + 1;
      golesPrevios = item.goles;
    }
    item.posicion = posicion;
  });

  return lista;
}

/** Agrupa los partidos por jornada. Devuelve [{jornada, fecha, partidos}]. */
export function agruparPorJornada(partidos) {
  const mapa = new Map();
  for (const p of partidos) {
    if (!mapa.has(p.jornada)) mapa.set(p.jornada, []);
    mapa.get(p.jornada).push(p);
  }
  return [...mapa.entries()]
    .map(([jornada, lista]) => ({
      jornada,
      fecha: lista[0]?.fecha ?? null,
      jugada: lista.every((p) => p.estado === 'jugado'),
      partidos: lista.sort((a, b) => (a.hora || '').localeCompare(b.hora || '')),
    }))
    .sort((a, b) => a.jornada - b.jornada);
}

/** Resumen numérico del torneo para la portada. */
export function resumenTorneo(partidos, clasificacion) {
  const jugados = partidos.filter((p) => p.estado === 'jugado');
  const goles = jugados.reduce((s, p) => s + p.golesLocal + p.golesVisitante, 0);
  return {
    partidosJugados: jugados.length,
    partidosTotales: partidos.length,
    goles,
    promedioGoles: jugados.length ? (goles / jugados.length).toFixed(2) : '0.00',
    lider: clasificacion[0] || null,
  };
}

/** Estadísticas de un equipo concreto, para su ficha. */
export function estadisticasEquipo(equipoId, clasificacion, partidos, jugadores) {
  const fila = clasificacion.find((f) => f.equipo.id === equipoId) || null;
  const suyos = partidos.filter(
    (p) => p.localId === equipoId || p.visitanteId === equipoId
  );

  const golesPorJugador = new Map();
  for (const p of partidos) {
    if (p.estado !== 'jugado') continue;
    for (const g of p.goleadores || []) {
      golesPorJugador.set(g.jugadorId, (golesPorJugador.get(g.jugadorId) || 0) + 1);
    }
  }

  const plantilla = jugadores
    .filter((j) => j.equipoId === equipoId)
    .map((j) => ({ ...j, goles: golesPorJugador.get(j.id) || 0 }));

  return {
    fila,
    partidos: suyos.sort((a, b) => a.jornada - b.jornada),
    plantilla,
    maximoGoleador: [...plantilla].sort((a, b) => b.goles - a.goles)[0] || null,
  };
}
