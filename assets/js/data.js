/**
 * CAPA DE DATOS — punto único de acceso a la información.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE TOCAR PARA MIGRAR A SUPABASE.
 *
 * Hoy:    lee los JSON de /data y guarda los cambios en localStorage.
 * Mañana: las mismas funciones consultan Supabase. El resto del sitio no se
 *         entera: sigue llamando a Datos.getClubes(), Datos.agregarJugador()...
 *         con la misma firma y las mismas validaciones.
 *
 * Las funciones que escriben ya son async, así que al migrar no hay que tocar
 * ninguna vista.
 * ────────────────────────────────────────────────────────────────────────────
 */

const CLAVE = 'copa-fugaz:datos';

/** Estado en memoria. Se rellena en cargar(). */
const estado = {
  torneo: null,
  torneos: [],
  clubes: [],
  jugadores: [],
  inscripciones: [],
  partidos: [],
  cargado: false,
};

/* ─────────────────────── almacenamiento del navegador ───────────────────────
 * Guarda solo lo que el usuario ha añadido o cambiado, nunca una copia entera
 * de los datos. Al migrar a Supabase todo este bloque desaparece.
 */
/**
 * Estructura vacía. Tiene que ser una FUNCIÓN, no una constante compartida:
 * con un objeto único, `{ ...VACIO }` copia las referencias de los arrays, y
 * el primer push tras vaciar el almacenamiento acabaría escribiendo dentro del
 * propio objeto por defecto. Ese dato sobreviviría a "descartar mis cambios".
 */
function estructuraVacia() {
  return {
    resultados: {},         // partidoId -> { golesLocal, golesVisitante, ... }
    torneos: [],            // torneos creados desde el panel
    categorias: [],         // categorías añadidas: { torneoId, ...categoria }
    categoriasEditadas: {}, // categoriaId -> cambios (p. ej. fechaLimite)
    clubes: [],             // clubes registrados desde el portal
    inscripciones: [],
    jugadores: [],
    jugadoresBorrados: [],
  };
}

function leerLocal() {
  try {
    return { ...estructuraVacia(), ...JSON.parse(localStorage.getItem(CLAVE) || '{}') };
  } catch {
    return estructuraVacia();
  }
}

function escribirLocal(datos) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(datos));
    return true;
  } catch {
    return false; // modo incógnito o almacenamiento lleno
  }
}

function mutar(cambiar) {
  const datos = leerLocal();
  cambiar(datos);
  escribirLocal(datos);
}

/* ───────────────────────────── carga inicial ───────────────────────────── */

async function pedirJson(ruta) {
  const res = await fetch(ruta, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`No se pudo cargar ${ruta} (HTTP ${res.status})`);
  return res.json();
}

function aplicarLocal() {
  const local = leerLocal();

  // Torneos y categorías creados desde el panel del organizador.
  estado.torneos = [...estado.torneos, ...local.torneos];
  for (const c of local.categorias) {
    const torneo = estado.torneos.find((t) => t.id === c.torneoId);
    if (torneo && !torneo.categorias.some((x) => x.id === c.id)) {
      torneo.categorias.push({ ...c });
    }
  }
  for (const torneo of estado.torneos) {
    torneo.categorias = torneo.categorias.map((cat) =>
      local.categoriasEditadas[cat.id] ? { ...cat, ...local.categoriasEditadas[cat.id] } : cat
    );
  }

  estado.clubes = [...estado.clubes, ...local.clubes];
  estado.inscripciones = [...estado.inscripciones, ...local.inscripciones];

  const borrados = new Set(local.jugadoresBorrados);
  estado.jugadores = [...estado.jugadores, ...local.jugadores].filter(
    (j) => !borrados.has(j.id)
  );

  estado.partidos = estado.partidos.map((p) =>
    local.resultados[p.id] ? { ...p, ...local.resultados[p.id] } : p
  );
}

export const Datos = {
  async cargar() {
    if (estado.cargado) return;
    const [torneo, torneos, clubes, jugadores, inscripciones, partidos] = await Promise.all([
      pedirJson('data/torneo.json'),
      pedirJson('data/torneos.json'),
      pedirJson('data/clubes.json'),
      pedirJson('data/jugadores.json'),
      pedirJson('data/inscripciones.json'),
      pedirJson('data/partidos.json'),
    ]);
    estado.torneo = torneo;
    estado.torneos = torneos.map((t) => ({ ...t, categorias: [...t.categorias] }));
    estado.clubes = clubes;
    estado.jugadores = jugadores;
    estado.inscripciones = inscripciones;
    estado.partidos = partidos;
    aplicarLocal();
    estado.cargado = true;
  },

  /* ───────────────────────────── torneos ───────────────────────────── */

  getTorneo: (id) =>
    id ? estado.torneos.find((t) => t.id === id) || null : estado.torneo,

  getTorneos: () => [...estado.torneos],

  /** Todas las categorías, o las de un torneo. Cada una lleva su torneo dentro. */
  getCategorias(torneoId) {
    const torneos = torneoId
      ? estado.torneos.filter((t) => t.id === torneoId)
      : estado.torneos;
    return torneos.flatMap((t) => t.categorias.map((c) => ({ ...c, torneo: t })));
  },

  getCategoria(categoriaId) {
    for (const t of estado.torneos) {
      const c = t.categorias.find((x) => x.id === categoriaId);
      if (c) return { ...c, torneo: t };
    }
    return null;
  },

  /**
   * ¿Sigue abierto el plazo de inscripción de una categoría?
   * La fecha límite cuenta entera: se puede inscribir durante todo ese día.
   */
  plazoAbierto(categoria) {
    if (!categoria?.fechaLimite) return { abierto: true, dias: null };
    const [a, m, d] = categoria.fechaLimite.split('-').map(Number);
    const limite = new Date(a, m - 1, d, 23, 59, 59);
    const ahora = new Date();
    const dias = Math.ceil((limite - ahora) / 86400000);
    return { abierto: ahora <= limite, dias, limite };
  },

  async crearTorneo({ nombre, modalidad, jugadoresPorEquipo }) {
    const limpio = String(nombre || '').trim();
    if (limpio.length < 3) return { ok: false, motivo: 'El nombre del torneo es demasiado corto.' };
    if (estado.torneos.some((t) => t.nombre.toLowerCase() === limpio.toLowerCase())) {
      return { ok: false, motivo: 'Ya existe un torneo con ese nombre.' };
    }
    const torneo = {
      id: `torneo-${Date.now()}`,
      nombre: limpio,
      modalidad: String(modalidad || '').trim() || 'Fútbol 11',
      temporada: estado.torneo?.temporada || String(new Date().getFullYear()),
      jugadoresPorEquipo: Number(jugadoresPorEquipo) || 11,
      categorias: [],
    };
    estado.torneos.push(torneo);
    mutar((d) => d.torneos.push(torneo));
    return { ok: true, torneo };
  },

  async crearCategoria(torneoId, { nombre, edadMinima, edadMaxima, fechaLimite, maxJugadores }) {
    const torneo = estado.torneos.find((t) => t.id === torneoId);
    if (!torneo) return { ok: false, motivo: 'Ese torneo no existe.' };

    const limpio = String(nombre || '').trim();
    if (!limpio) return { ok: false, motivo: 'Ponle un nombre a la categoría.' };
    if (torneo.categorias.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase())) {
      return { ok: false, motivo: `${torneo.nombre} ya tiene una categoría "${limpio}".` };
    }
    if (!fechaLimite) return { ok: false, motivo: 'Hay que fijar una fecha límite de inscripción.' };

    const min = edadMinima === '' || edadMinima == null ? null : Number(edadMinima);
    const max = edadMaxima === '' || edadMaxima == null ? null : Number(edadMaxima);
    if (min != null && max != null && min > max) {
      return { ok: false, motivo: 'La edad mínima no puede ser mayor que la máxima.' };
    }

    const categoria = {
      id: `cat-${Date.now()}`,
      torneoId,
      nombre: limpio,
      edadMinima: min,
      edadMaxima: max,
      fechaLimite,
      maxJugadores: Number(maxJugadores) || 20,
    };
    torneo.categorias.push(categoria);
    mutar((d) => d.categorias.push(categoria));
    return { ok: true, categoria };
  },

  /** Cambia la fecha límite (u otro dato) de una categoría existente. */
  async actualizarCategoria(categoriaId, cambios) {
    let encontrada = null;
    for (const t of estado.torneos) {
      const c = t.categorias.find((x) => x.id === categoriaId);
      if (c) { Object.assign(c, cambios); encontrada = c; break; }
    }
    if (!encontrada) return { ok: false, motivo: 'Esa categoría no existe.' };
    mutar((d) => {
      d.categoriasEditadas[categoriaId] = { ...d.categoriasEditadas[categoriaId], ...cambios };
    });
    return { ok: true, categoria: encontrada };
  },

  /* ───────────────────────────── clubes ────────────────────────────── */

  getClubes: () => [...estado.clubes],

  getClub: (id) => estado.clubes.find((c) => c.id === id) || null,

  async registrarClub({ nombre, abreviatura, colorPrimario, colorSecundario, estadio, dirigente }) {
    const limpio = String(nombre || '').trim();
    if (limpio.length < 3) return { ok: false, motivo: 'El nombre del club es demasiado corto.' };
    if (estado.clubes.some((c) => c.nombre.toLowerCase() === limpio.toLowerCase())) {
      return { ok: false, motivo: 'Ya hay un club registrado con ese nombre.' };
    }
    const abrev = String(abreviatura || '').trim().toUpperCase() ||
      limpio.replace(/[^A-Za-zÁÉÍÓÚÑ ]/g, '').split(/\s+/).map((p) => p[0]).join('').slice(0, 3);
    if (!String(dirigente?.nombre || '').trim()) {
      return { ok: false, motivo: 'Hace falta el nombre del dirigente responsable.' };
    }

    const club = {
      id: `club-${Date.now()}`,
      nombre: limpio,
      abreviatura: abrev.slice(0, 4),
      colorPrimario: colorPrimario || '#9ee641',
      colorSecundario: colorSecundario || '#0f1115',
      fundacion: null,
      estadio: String(estadio || '').trim(),
      dirigente: {
        nombre: String(dirigente.nombre).trim(),
        correo: String(dirigente.correo || '').trim(),
        telefono: String(dirigente.telefono || '').trim(),
      },
      fechaRegistro: new Date().toISOString().slice(0, 10),
    };
    estado.clubes.push(club);
    mutar((d) => d.clubes.push(club));
    return { ok: true, club };
  },

  /* ─────────────────────────── inscripciones ───────────────────────── */

  getInscripciones(filtro = {}) {
    return estado.inscripciones.filter(
      (i) =>
        (!filtro.torneoId || i.torneoId === filtro.torneoId) &&
        (!filtro.categoriaId || i.categoriaId === filtro.categoriaId) &&
        (!filtro.clubId || i.clubId === filtro.clubId)
    );
  },

  getInscripcion: (id) => estado.inscripciones.find((i) => i.id === id) || null,

  async crearInscripcion({ clubId, categoriaId }) {
    const club = this.getClub(clubId);
    if (!club) return { ok: false, motivo: 'Ese club no existe.' };

    const categoria = this.getCategoria(categoriaId);
    if (!categoria) return { ok: false, motivo: 'Esa categoría no existe.' };

    const plazo = this.plazoAbierto(categoria);
    if (!plazo.abierto) {
      return {
        ok: false,
        motivo: `El plazo de ${categoria.torneo.nombre} · ${categoria.nombre} cerró el ${categoria.fechaLimite}.`,
      };
    }

    const yaExiste = estado.inscripciones.find(
      (i) => i.clubId === clubId && i.categoriaId === categoriaId
    );
    if (yaExiste) return { ok: true, inscripcion: yaExiste, yaExistia: true };

    const inscripcion = {
      id: `insc-${clubId}-${categoriaId}-${Date.now()}`,
      clubId,
      torneoId: categoria.torneo.id,
      categoriaId,
      estado: 'borrador',
      fechaInscripcion: new Date().toISOString().slice(0, 10),
    };
    estado.inscripciones.push(inscripcion);
    mutar((d) => d.inscripciones.push(inscripcion));
    return { ok: true, inscripcion };
  },

  /** Envía la nómina al organizador. Comprueba que haya jugadores suficientes. */
  async enviarInscripcion(inscripcionId) {
    const inscripcion = this.getInscripcion(inscripcionId);
    if (!inscripcion) return { ok: false, motivo: 'Esa inscripción no existe.' };

    const categoria = this.getCategoria(inscripcion.categoriaId);
    const plazo = this.plazoAbierto(categoria);
    if (!plazo.abierto) {
      return { ok: false, motivo: `El plazo cerró el ${categoria.fechaLimite}. Ya no se puede enviar.` };
    }

    const minimo = categoria.torneo.jugadoresPorEquipo || 7;
    const jugadores = this.getJugadoresDeInscripcion(inscripcionId);
    if (jugadores.length < minimo) {
      return {
        ok: false,
        motivo: `Necesitas al menos ${minimo} jugadores para ${categoria.torneo.modalidad}. Llevas ${jugadores.length}.`,
      };
    }

    inscripcion.estado = 'enviada';
    mutar((d) => {
      const propia = d.inscripciones.find((i) => i.id === inscripcionId);
      if (propia) propia.estado = 'enviada';
      else d.inscripciones.push({ ...inscripcion });
    });
    return { ok: true, inscripcion };
  },

  /* ──────────────────────────── jugadores ──────────────────────────── */

  getJugadores(clubId) {
    const lista = clubId
      ? estado.jugadores.filter((j) => j.equipoId === clubId)
      : [...estado.jugadores];
    return lista.sort((a, b) => a.dorsal - b.dorsal);
  },

  getJugador: (id) => estado.jugadores.find((j) => j.id === Number(id)) || null,

  getJugadoresDeInscripcion(inscripcionId) {
    return estado.jugadores
      .filter((j) => j.inscripcionId === inscripcionId)
      .sort((a, b) => a.dorsal - b.dorsal);
  },

  /**
   * Añade un jugador a una nómina.
   * Aquí viven las reglas que pidió el cliente: fecha límite, edad de la
   * categoría, cédula sin repetir y dorsal libre.
   */
  async agregarJugador(inscripcionId, { nombre, apellidos, cedula, edad, dorsal, posicion }) {
    const inscripcion = this.getInscripcion(inscripcionId);
    if (!inscripcion) return { ok: false, motivo: 'Esa inscripción no existe.' };

    const categoria = this.getCategoria(inscripcion.categoriaId);
    const plazo = this.plazoAbierto(categoria);
    if (!plazo.abierto) {
      return {
        ok: false,
        motivo: `El plazo de inscripción cerró el ${categoria.fechaLimite}. Ya no se pueden añadir jugadores.`,
      };
    }

    const nom = String(nombre || '').trim();
    const ape = String(apellidos || '').trim();
    const ced = String(cedula || '').trim();
    const anios = Number(edad);

    if (!nom) return { ok: false, motivo: 'Falta el nombre del jugador.' };
    if (!ape) return { ok: false, motivo: 'Faltan los apellidos del jugador.' };
    if (!/^[0-9]{6,12}$/.test(ced)) {
      return { ok: false, motivo: 'La cédula debe tener entre 6 y 12 dígitos, sin letras ni guiones.' };
    }
    if (!Number.isFinite(anios) || anios < 4 || anios > 80) {
      return { ok: false, motivo: 'La edad no parece válida.' };
    }

    if (categoria.edadMaxima != null && anios > categoria.edadMaxima) {
      return {
        ok: false,
        motivo: `${nom} tiene ${anios} años y ${categoria.nombre} admite hasta ${categoria.edadMaxima}.`,
      };
    }
    if (categoria.edadMinima != null && anios < categoria.edadMinima) {
      return {
        ok: false,
        motivo: `${nom} tiene ${anios} años y ${categoria.nombre} exige al menos ${categoria.edadMinima}.`,
      };
    }

    const nomina = this.getJugadoresDeInscripcion(inscripcionId);
    if (categoria.maxJugadores && nomina.length >= categoria.maxJugadores) {
      return { ok: false, motivo: `${categoria.nombre} permite un máximo de ${categoria.maxJugadores} jugadores.` };
    }
    if (estado.jugadores.some((j) => j.cedula === ced && j.inscripcionId === inscripcionId)) {
      return { ok: false, motivo: 'Esa cédula ya está en esta nómina.' };
    }

    const enOtroClub = estado.jugadores.find(
      (j) => j.cedula === ced && j.inscripcionId !== inscripcionId &&
             this.getInscripcion(j.inscripcionId)?.categoriaId === inscripcion.categoriaId
    );
    if (enOtroClub) {
      const otro = this.getClub(enOtroClub.clubId);
      return {
        ok: false,
        motivo: `Esa cédula ya está inscrita en ${otro?.nombre || 'otro club'} en esta misma categoría.`,
      };
    }

    let numero = Number(dorsal);
    if (!numero || nomina.some((j) => j.dorsal === numero)) {
      numero = 1;
      while (nomina.some((j) => j.dorsal === numero)) numero++;
    }

    const jugador = {
      id: Math.max(0, ...estado.jugadores.map((j) => j.id)) + 1,
      nombre: nom,
      apellidos: ape,
      nombreCompleto: `${nom} ${ape}`,
      cedula: ced,
      edad: anios,
      dorsal: numero,
      posicion: posicion || 'Sin definir',
      clubId: inscripcion.clubId,
      inscripcionId,
      equipoId: null, // solo compite quien esté en el torneo en juego
    };

    estado.jugadores.push(jugador);
    mutar((d) => d.jugadores.push(jugador));
    return { ok: true, jugador };
  },

  async quitarJugador(jugadorId) {
    const id = Number(jugadorId);
    const jugador = this.getJugador(id);
    if (!jugador) return { ok: false, motivo: 'Ese jugador no existe.' };

    const inscripcion = this.getInscripcion(jugador.inscripcionId);
    const categoria = inscripcion ? this.getCategoria(inscripcion.categoriaId) : null;
    if (categoria && !this.plazoAbierto(categoria).abierto) {
      return { ok: false, motivo: `El plazo cerró el ${categoria.fechaLimite}. La nómina ya no se puede tocar.` };
    }

    estado.jugadores = estado.jugadores.filter((j) => j.id !== id);
    mutar((d) => {
      d.jugadores = d.jugadores.filter((j) => j.id !== id);
      if (!d.jugadoresBorrados.includes(id)) d.jugadoresBorrados.push(id);
    });
    return { ok: true };
  },

  /* ─────────────────────────── competición ─────────────────────────── */

  getEquipos: () => [...estado.clubes],

  getEquipo: (id) => estado.clubes.find((c) => c.id === id) || null,

  getPartidos: () => [...estado.partidos],

  getPartido: (id) => estado.partidos.find((p) => p.id === id) || null,

  getPartidosDeEquipo(equipoId) {
    return estado.partidos
      .filter((p) => p.localId === equipoId || p.visitanteId === equipoId)
      .sort((a, b) => a.jornada - b.jornada);
  },

  jornadaActual() {
    const jugadas = estado.partidos.filter((p) => p.estado === 'jugado');
    return jugadas.length ? Math.max(...jugadas.map((p) => p.jornada)) : 0;
  },

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
    mutar((d) => { d.resultados[partidoId] = actualizado; });
    return { ok: true };
  },

  async borrarResultado(partidoId) {
    const partido = estado.partidos.find((p) => p.id === partidoId);
    if (!partido) return { ok: false, motivo: 'El partido no existe.' };

    const limpio = { estado: 'pendiente', golesLocal: null, golesVisitante: null, goleadores: [] };
    Object.assign(partido, limpio);
    mutar((d) => { d.resultados[partidoId] = limpio; });
    return { ok: true };
  },

  /* ──────────────────────────── utilidades ─────────────────────────── */

  hayCambiosLocales() {
    const d = leerLocal();
    return (
      Object.keys(d.resultados).length > 0 ||
      d.torneos.length > 0 || d.categorias.length > 0 ||
      Object.keys(d.categoriasEditadas).length > 0 ||
      d.clubes.length > 0 || d.inscripciones.length > 0 ||
      d.jugadores.length > 0 || d.jugadoresBorrados.length > 0
    );
  },

  async restaurarOriginales() {
    localStorage.removeItem(CLAVE);
    estado.cargado = false;
    await this.cargar();
  },
};
