/**
 * Animaciones de la portada.
 *
 * Sin librerías: IntersectionObserver y requestAnimationFrame.
 * Todo se apaga solo si el sistema pide menos movimiento
 * (`prefers-reduced-motion`), y el contenido se ve igual sin animación:
 * nunca se depende de JavaScript para poder leer la página.
 */

const menosMovimiento = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lo que haya que detener al cambiar de página. */
let limpiezas = [];

export function detenerAnimaciones() {
  limpiezas.forEach((fn) => fn());
  limpiezas = [];
}

/* ─────────────────────── revelado al hacer scroll ──────────────────────── */

export function revelarAlEntrar(raiz = document) {
  const elementos = [...raiz.querySelectorAll('.revelar:not(.revelar--visto)')];
  if (!elementos.length) return;

  // Sin observador o con menos movimiento: no ocultamos nada y listo.
  if (menosMovimiento() || !('IntersectionObserver' in window)) {
    elementos.forEach((el) => el.classList.add('revelar--visto'));
    return;
  }

  const mostrar = (el) => {
    el.classList.remove('revelar--armado');
    el.classList.add('revelar--visto');
  };

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        // Escalonamos los hermanos para que entren en cascada, no de golpe.
        const retraso = Number(entrada.target.dataset.retraso || 0);
        setTimeout(() => mostrar(entrada.target), retraso);
        observador.unobserve(entrada.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  elementos.forEach((el, i) => {
    if (!el.dataset.retraso) el.dataset.retraso = String(Math.min(i, 6) * 70);
    el.classList.add('revelar--armado');
    observador.observe(el);
  });

  // Red de seguridad: si algo impide que el observador dispare, a los 2
  // segundos se muestra todo igualmente. Nunca dejamos texto invisible.
  const rescate = setTimeout(() => elementos.forEach(mostrar), 2000);

  limpiezas.push(() => {
    observador.disconnect();
    clearTimeout(rescate);
    elementos.forEach((el) => el.classList.remove('revelar--armado'));
  });
}

/* ───────────────────────── máquina de escribir ─────────────────────────── */

/**
 * Escribe y borra una lista de frases en bucle.
 * Si hay que reducir movimiento, deja fija la primera y no hace nada más.
 */
export function maquinaDeEscribir(elemento, frases, opciones = {}) {
  if (!elemento || !frases.length) return;

  if (menosMovimiento()) {
    elemento.textContent = frases[0];
    return;
  }

  const escribir = opciones.escribir ?? 55;
  const borrar = opciones.borrar ?? 28;
  const pausa = opciones.pausa ?? 1600;

  let indice = 0;
  let letra = 0;
  let borrando = false;
  let temporizador;

  elemento.classList.add('escribiendo');

  const paso = () => {
    const frase = frases[indice];
    letra += borrando ? -1 : 1;
    elemento.textContent = frase.slice(0, letra);

    let espera = borrando ? borrar : escribir;

    if (!borrando && letra === frase.length) {
      borrando = true;
      espera = pausa;
    } else if (borrando && letra === 0) {
      borrando = false;
      indice = (indice + 1) % frases.length;
      espera = 320;
    }
    temporizador = setTimeout(paso, espera);
  };

  temporizador = setTimeout(paso, 500);
  limpiezas.push(() => {
    clearTimeout(temporizador);
    elemento.classList.remove('escribiendo');
  });
}

/* ──────────────────────────────── parallax ─────────────────────────────── */

/**
 * Desplaza elementos con [data-parallax] a distinta velocidad al hacer scroll.
 * El valor del atributo es el factor: 0.2 se mueve poco, 0.6 bastante.
 */
export function parallax(raiz = document) {
  const capas = [...raiz.querySelectorAll('[data-parallax]')];
  if (!capas.length || menosMovimiento()) return;

  let pendiente = false;

  const pintar = () => {
    const y = window.scrollY;
    capas.forEach((capa) => {
      const factor = parseFloat(capa.dataset.parallax) || 0.2;
      capa.style.transform = `translate3d(0, ${(y * factor).toFixed(1)}px, 0)`;
    });
    pendiente = false;
  };

  const alHacerScroll = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(pintar);
  };

  window.addEventListener('scroll', alHacerScroll, { passive: true });
  pintar();

  limpiezas.push(() => {
    window.removeEventListener('scroll', alHacerScroll);
    capas.forEach((c) => { c.style.transform = ''; });
  });
}

/* ───────────────────────── contadores animados ─────────────────────────── */

/** Cuenta de 0 al número que ya tenga el elemento, cuando entra en pantalla. */
export function contadores(raiz = document) {
  const elementos = [...raiz.querySelectorAll('[data-contar]')];
  if (!elementos.length) return;

  if (menosMovimiento() || !('IntersectionObserver' in window)) return;

  const animar = (el) => {
    const destino = parseFloat(el.dataset.contar);
    if (!Number.isFinite(destino)) return;
    const decimales = (el.dataset.contar.split('.')[1] || '').length;
    const duracion = 900;
    const inicio = performance.now();

    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      // Suavizado: rápido al principio, frena al final.
      const suave = 1 - Math.pow(1 - t, 3);
      el.textContent = (destino * suave).toFixed(decimales);
      if (t < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        animar(e.target);
        observador.unobserve(e.target);
      });
    },
    { threshold: 0.5 }
  );

  elementos.forEach((el) => observador.observe(el));
  limpiezas.push(() => observador.disconnect());
}

/**
 * Arranca lo que corresponda a la vista recién pintada.
 *
 * NO llama a detenerAnimaciones(): de eso se encarga pintar() antes de tocar
 * el HTML. Si lo hiciera aquí mataría lo que la propia vista haya arrancado en
 * su activar(), que se ejecuta antes que esto.
 */
export function activarAnimaciones(raiz = document) {
  revelarAlEntrar(raiz);
  parallax(raiz);
  contadores(raiz);
}
