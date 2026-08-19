/**
 * SESIÓN — quién ha entrado y qué puede hacer.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ⚠️  ESTO TODAVÍA NO ES SEGURIDAD.
 *
 * Las credenciales están en `data/usuarios.json` en texto plano y todo se
 * comprueba en el navegador. Funciona de verdad para usar la plataforma, pero
 * no protege nada frente a alguien que sepa mirar el código.
 *
 * En producción esto se sustituye por **Supabase Auth**: la contraseña nunca
 * viaja al repositorio, la sesión la firma el servidor y quién puede ver o
 * tocar cada nómina lo deciden las políticas RLS de la base de datos, no este
 * archivo.
 *
 * ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE REESCRIBIR PARA ESA MIGRACIÓN.
 * El resto del sitio solo usa Sesion.actual(), Sesion.esOrganizador(), etc.
 * ────────────────────────────────────────────────────────────────────────────
 */

const CLAVE_SESION = 'copa-fugaz:sesion';

let usuarios = [];
let cargado = false;

/** Datos que guardamos de la sesión. Nunca la contraseña. */
function publico(u) {
  return {
    id: u.id, usuario: u.usuario, nombre: u.nombre,
    rol: u.rol, clubId: u.clubId,
    membresia: u.membresia ? { ...u.membresia } : null,
  };
}

const CLAVE_MEMBRESIAS = 'copa-fugaz:membresias';
const CLAVE_ACCESOS = 'copa-fugaz:accesos';

/** Accesos de dirigente que ha creado el organizador al registrar sus clubes. */
function accesosLocales() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ACCESOS) || '[]');
  } catch {
    return [];
  }
}

function guardarAccesos(lista) {
  try {
    localStorage.setItem(CLAVE_ACCESOS, JSON.stringify(lista));
    return true;
  } catch {
    return false;
  }
}

/** Contraseña corta, legible y fácil de dictar por teléfono. */
function claveNueva() {
  const letras = 'abcdefghijkmnpqrstuvwxyz';
  const numeros = '23456789';
  const al = new Uint32Array(6);
  crypto.getRandomValues(al);
  return (
    Array.from({ length: 4 }, (_, i) => letras[al[i] % letras.length]).join('') +
    Array.from({ length: 2 }, (_, i) => numeros[al[i + 4] % numeros.length]).join('')
  );
}

function membresiasLocales() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_MEMBRESIAS) || '{}');
  } catch {
    return {};
  }
}

export const Sesion = {
  async cargar() {
    if (cargado) return;
    const res = await fetch('data/usuarios.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`No se pudo cargar las cuentas (HTTP ${res.status})`);
    usuarios = await res.json();
    cargado = true;
  },

  /** Todas las cuentas: las del archivo más las que ha creado el organizador. */
  todasLasCuentas() {
    return [...usuarios, ...accesosLocales()];
  },

/**
   * Crea la cuenta de un dirigente junto con su club, en un solo paso.
   *
   * Es la puerta de entrada de quien llega por su cuenta: no depende de que
   * el organizador le genere nada. En producción esto será un registro de
   * Supabase Auth más una fila en la tabla de clubes.
   */
  async crearCuenta({ club, dirigente, telefono, usuario, clave }) {
    const nombreClub = String(club || '').trim();
    const nombreDir = String(dirigente || '').trim();
    const user = String(usuario || '').trim().toLowerCase();
    const pass = String(clave || '');

    if (nombreClub.length < 3) {
      return { ok: false, motivo: 'Escribe el nombre completo de tu club.' };
    }
    if (nombreDir.length < 3) {
      return { ok: false, motivo: 'Escribe tu nombre y apellido.' };
    }
    if (!/^[a-z0-9._-]{4,20}$/.test(user)) {
      return {
        ok: false,
        motivo: 'El usuario debe tener entre 4 y 20 caracteres, sin espacios ni acentos.',
      };
    }
    if (this.todasLasCuentas().some((u) => u.usuario.toLowerCase() === user)) {
      return { ok: false, motivo: `El usuario "${user}" ya está ocupado. Prueba con otro.` };
    }
    if (pass.length < 4) {
      return { ok: false, motivo: 'La contraseña necesita al menos 4 caracteres.' };
    }

    return {
      ok: true,
      datos: { nombreClub, nombreDir, telefono: String(telefono || '').trim(), user, pass },
    };
  },

  /** Guarda el acceso ya validado y deja la sesión abierta. */
  async registrarAcceso(club, { user, pass, nombreDir }) {
    const acceso = {
      id: `u-${club.id}`,
      usuario: user,
      clave: pass,
      rol: 'dirigente',
      nombre: nombreDir,
      clubId: club.id,
      membresia: null,
    };
    guardarAccesos([...accesosLocales(), acceso]);

    const sesion = publico(acceso);
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      /* sin almacenamiento: la sesión dura lo que la pestaña */
    }
    return { ok: true, sesion };
  },

    /** Accesos de dirigente creados, para que el organizador pueda consultarlos. */
  accesosDeDirigentes: () => accesosLocales().map((a) => ({ ...a })),

  /**
   * Crea el acceso del dirigente de un club recién registrado.
   * En producción esto será una invitación por correo desde Supabase Auth.
   */
  crearAccesoDirigente(club) {
    const base = String(club.nombre)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/^(cd|cf|ad|club|deportivo|real|sporting|racing|union|atletico)\s+/, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 14) || 'club';

    const existentes = this.todasLasCuentas().map((u) => u.usuario);
    let usuario = base;
    let n = 2;
    while (existentes.includes(usuario)) usuario = base + n++;

    const acceso = {
      id: `u-${club.id}`,
      usuario,
      clave: claveNueva(),
      rol: 'dirigente',
      nombre: club.dirigente?.nombre || club.nombre,
      clubId: club.id,
      membresia: null,
    };
    guardarAccesos([...accesosLocales(), acceso]);
    return acceso;
  },

  async entrar(usuario, clave) {
    const nombre = String(usuario || '').trim().toLowerCase();
    const secreto = String(clave || '');

    if (!nombre || !secreto) {
      return { ok: false, motivo: 'Escribe tu usuario y tu contraseña.' };
    }

    const encontrado = this.todasLasCuentas().find((u) => u.usuario.toLowerCase() === nombre);
    // Mismo mensaje si falla el usuario o la contraseña: no damos pistas.
    if (!encontrado || encontrado.clave !== secreto) {
      return { ok: false, motivo: 'Usuario o contraseña incorrectos.' };
    }

    const sesion = publico(encontrado);
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      /* modo incógnito: la sesión no sobrevive a recargar, pero funciona */
    }
    return { ok: true, sesion };
  },

  salir() {
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      /* nada que hacer */
    }
  },

  /** La sesión abierta, o null. Se revalida contra las cuentas conocidas. */
  actual() {
    let guardada;
    try {
      guardada = JSON.parse(localStorage.getItem(CLAVE_SESION) || 'null');
    } catch {
      return null;
    }
    if (!guardada?.id) return null;
    // Si la cuenta ya no existe (por ejemplo cambió el JSON), la sesión cae.
    const vigente = this.todasLasCuentas().find((u) => u.id === guardada.id);
    if (!vigente) return null;

    const s = publico(vigente);
    const activada = membresiasLocales()[vigente.id];
    if (activada) s.membresia = activada;
    return s;
  },

  hayAlguien() {
    return this.actual() !== null;
  },

  esOrganizador() {
    return this.actual()?.rol === 'organizador';
  },

  esDirigente() {
    return this.actual()?.rol === 'dirigente';
  },

  /** El club del dirigente que ha entrado. null para el organizador. */
  clubDeLaSesion() {
    const s = this.actual();
    return s?.rol === 'dirigente' ? s.clubId : null;
  },

  /**
   * ¿Puede la sesión actual tocar la nómina de este club?
   * El organizador puede verlo todo; el dirigente, solo lo suyo.
   * En producción esto será una política RLS, no una función de JavaScript.
   */
  puedeGestionarClub(clubId) {
    const s = this.actual();
    if (!s) return false;
    if (s.rol === 'organizador') return true;
    return s.clubId === clubId;
  },

  /* ─────────────────────────── membresía ─────────────────────────────
   * Organizar un torneo es de pago. Los clubes se inscriben gratis.
   * En producción el estado lo dirá la pasarela de pago, no este archivo.
   */

  membresia() {
    return this.actual()?.membresia || null;
  },

  /** ¿La cuenta puede administrar torneos ahora mismo? */
  tieneMembresiaActiva() {
    const m = this.membresia();
    if (!m || m.estado !== 'activa') return false;
    if (!m.vence) return true;
    const [a, me, d] = String(m.vence).split('-').map(Number);
    return new Date(a, me - 1, d, 23, 59, 59) >= new Date();
  },

  /**
   * Activa un plan. En el demo es inmediato y no cobra nada.
   * En producción esto lo confirmará la pasarela de pago mediante un webhook.
   */
  async activarPlan(planId, meses = 12) {
    const s = this.actual();
    if (!s) return { ok: false, motivo: 'Primero tienes que entrar.' };
    if (s.rol !== 'organizador') {
      return { ok: false, motivo: 'Las membresías son para cuentas de organizador.' };
    }

    const vence = new Date();
    vence.setMonth(vence.getMonth() + meses);
    const membresia = {
      plan: planId,
      estado: 'activa',
      vence: vence.toISOString().slice(0, 10),
    };

    try {
      const todas = membresiasLocales();
      todas[s.id] = membresia;
      localStorage.setItem(CLAVE_MEMBRESIAS, JSON.stringify(todas));
    } catch {
      /* modo incógnito: vale para la sesión actual */
    }
    return { ok: true, membresia };
  },

  /** Devuelve la cuenta al estado sin membresía (para repetir la demostración). */
  async cancelarPlan() {
    const s = this.actual();
    if (!s) return { ok: false };
    try {
      const todas = membresiasLocales();
      todas[s.id] = { plan: null, estado: 'ninguna', vence: null };
      localStorage.setItem(CLAVE_MEMBRESIAS, JSON.stringify(todas));
    } catch {
      /* nada */
    }
    return { ok: true };
  },
};
