/**
 * SESIÓN — quién ha entrado y qué puede hacer.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * ⚠️  ESTO NO ES SEGURIDAD. Es una demostración del flujo.
 *
 * Las credenciales están en `data/usuarios.json`, en texto plano y en un
 * repositorio público: cualquiera puede leerlas. Además, todo se comprueba en
 * el navegador, así que cualquiera con las herramientas de desarrollador puede
 * saltárselo. Sirve para que el cliente vea cómo será el flujo, nada más.
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
  return { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol, clubId: u.clubId };
}

export const Sesion = {
  async cargar() {
    if (cargado) return;
    const res = await fetch('data/usuarios.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`No se pudo cargar las cuentas (HTTP ${res.status})`);
    usuarios = await res.json();
    cargado = true;
  },

  /** Cuentas de ejemplo, para poder enseñarlas en la pantalla de acceso. */
  cuentasDemo: () => usuarios.map(publico),

  /** Contraseña de ejemplo de un rol, solo para mostrarla en el demo. */
  claveDemo(rol) {
    return usuarios.find((u) => u.rol === rol)?.clave || '';
  },

  async entrar(usuario, clave) {
    const nombre = String(usuario || '').trim().toLowerCase();
    const secreto = String(clave || '');

    if (!nombre || !secreto) {
      return { ok: false, motivo: 'Escribe tu usuario y tu contraseña.' };
    }

    const encontrado = usuarios.find((u) => u.usuario.toLowerCase() === nombre);
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
    const vigente = usuarios.find((u) => u.id === guardada.id);
    return vigente ? publico(vigente) : null;
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
};
