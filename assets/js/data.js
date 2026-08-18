/**
 * CAPA DE DATOS — punto único de acceso a la información del torneo.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE TOCAR PARA MIGRAR A SUPABASE.
 *
 * Hoy:     lee los JSON de /data y guarda los cambios en localStorage.
 * Mañana:  las mismas funciones consultan Supabase. El resto del sitio no
 *          se entera: sigue llamando a Datos.getEquipos(), Datos.getPartidos(),
 *          Datos.guardarResultado()... con la misma firma.
 *
 * Todas las funciones de lectura son síncronas tras llamar a Datos.cargar().
 * Al migrar pasarán a ser async — por eso las vistas ya usan await en cargar().
 * ────────────────────────────────────────────────────────────────────────────
 */

const CLAVE_RESULTADOS = 'copa-fugaz:resultados';

/** Estado en memoria. Se rellena en cargar(). */
const estado = {
  torneo: null,
  equipos: [],
  jugadores: [],
  partidos: [],
  cargado: false,
};

/* ───────────────────────── almacenamiento local ─────────────────────────
 * Guarda solo los resultados que el usuario ha modificado desde el panel,
 * no una copia entera de los datos. Así, si mañana cambian los JSON semilla,
 * los cambios del usuario se siguen aplicando encima sin conflictos.
 * Al migrar a Supabase, este bloque desaparece por completo.
 */
function leerCambiosLocales() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RESULTADOS) || '{}');
  } catch {
    return {};
  }
}

function escribirCambiosLocales(cambios) {
  try {
    localStorage.setItem(CLAVE_RESULTADOS, JSON.stringify(cambios));
    return true;
  } catch {
    // Modo incógnito o almacenamiento lleno: no rompemos la web, solo avisamos.
    return false;
  }
}

function aplicarCambiosLocales(partidos) {
  const cambios = leerCambiosLocales();
  return partidos.map((p) => {
    const c = cambios[p.id];
    return c ? { ...p, ...c } : p;
  });
}

/* ───────────────────────────── carga inicial ───────────────────────────── */

async function pedirJson(ruta) {
  const res = await fetch(ruta, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`No se pudo cargar ${ruta} (HTTP ${res.status})`);
  return res.json();
}

export const Datos = {
  /** Carga todo el torneo. Hay que llamarla una vez antes que nada. */
  async cargar() {
    if (estado.cargado) return;
    const [torneo, equipos, jugadores, partidos] = await Promise.all([
      pedirJson('data/torneo.json'),
      pedirJson('data/equipos.json'),
      pedirJson('data/jugadores.json'),
      pedirJson('data/partidos.json'),
    ]);
    estado.torneo = torneo;
    estado.equipos = equipos;
    estado.jugadores = jugadores;
    estado.partidos = aplicarCambiosLocales(partidos);
    estado.cargado = true;
  },

  getTorneo: () => estado.torneo,

  getEquipos: () => [...estado.equipos],

  getEquipo: (id) => estado.equipos.find((e) => e.id === id) || null,

  /** Jugadores de un equipo, ordenados por dorsal. Sin argumento, devuelve todos. */
  getJugadores(equipoId) {
    const lista = equipoId
      ? estado.jugadores.filter((j) => j.equipoId === equipoId)
      : [...estado.jugadores];
    return lista.sort((a, b) => a.dorsal - b.dorsal);
  },

  getJugador: (id) => estado.jugadores.find((j) => j.id === id) || null,

  getPartidos: () => [...estado.partidos],

  getPartido: (id) => estado.partidos.find((p) => p.id === id) || null,

  /** Partidos de un equipo, en orden de jornada. */
  getPartidosDeEquipo(equipoId) {
    return estado.partidos
      .filter((p) => p.localId === equipoId || p.visitanteId === equipoId)
      .sort((a, b) => a.jornada - b.jornada);
  },

  /** Número de la última jornada con algún partido jugado. 0 si no empezó. */
  jornadaActual() {
    const jugadas = estado.partidos.filter((p) => p.estado === 'jugado');
    return jugadas.length ? Math.max(...jugadas.map((p) => p.jornada)) : 0;
  },

  /**
   * Guarda el resultado de un partido.
   * → En Supabase esto será un update sobre la tabla `partidos` + upsert de goles.
   * @returns {{ok: boolean, motivo?: string}}
   */
  async guardarResultado(partidoId, { golesLocal, golesVisitante, goleadores = [] }) {
    const partido = estado.partidos.find((p) => p.id === partidoId);
    if (!partido) return { ok: false, motivo: 'El partido no existe.' };

    const gl = Number(golesLocal);
    const gv = Number(golesVisitante);
    if (!Number.isInteger(gl) || !Number.isInteger(gv) || gl < 0 || gv < 0) {
      return { ok: false, motivo: 'Los goles deben ser números enteros de 0 o más.' };
    }
    if (goleadores.length > gl + gv) {
      return { ok: false, motivo: 'Hay más goleadores anotados que goles en el marcador.' };
    }

    const actualizado = {
      estado: 'jugado',
      golesLocal: gl,
      golesVisitante: gv,
      goleadores: goleadores.map((g) => ({
        jugadorId: Number(g.jugadorId),
        minuto: Number(g.minuto) || 0,
      })),
    };

    Object.assign(partido, actualizado);

    const cambios = leerCambiosLocales();
    cambios[partidoId] = actualizado;
    const guardado = escribirCambiosLocales(cambios);

    return guardado
      ? { ok: true }
      : { ok: true, motivo: 'Guardado en pantalla, pero el navegador no permitió conservarlo.' };
  },

  /** Devuelve un partido a estado pendiente y borra su resultado. */
  async borrarResultado(partidoId) {
    const partido = estado.partidos.find((p) => p.id === partidoId);
    if (!partido) return { ok: false, motivo: 'El partido no existe.' };

    Object.assign(partido, {
      estado: 'pendiente',
      golesLocal: null,
      golesVisitante: null,
      goleadores: [],
    });

    const cambios = leerCambiosLocales();
    cambios[partidoId] = {
      estado: 'pendiente',
      golesLocal: null,
      golesVisitante: null,
      goleadores: [],
    };
    escribirCambiosLocales(cambios);
    return { ok: true };
  },

  /** ¿Hay cambios locales sin reflejar en los JSON semilla? */
  hayCambiosLocales: () => Object.keys(leerCambiosLocales()).length > 0,

  /** Descarta todos los cambios locales y vuelve a los datos originales. */
  async restaurarOriginales() {
    localStorage.removeItem(CLAVE_RESULTADOS);
    estado.cargado = false;
    await this.cargar();
  },
};
