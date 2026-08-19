/**
 * Iconos de línea, dibujados a mano en SVG.
 *
 * Se usan en vez de emojis: los emojis los pinta cada sistema a su manera y
 * desentonan con el escudo metálico. Estos heredan el color del contenedor y
 * tienen todos el mismo grosor de trazo, así el conjunto se ve de una pieza.
 */

const envoltorio = (contenido, tamano = 24) =>
  `<svg viewBox="0 0 24 24" width="${tamano}" height="${tamano}" fill="none"
        stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
        stroke-linejoin="round" aria-hidden="true">${contenido}</svg>`;

export const Iconos = {
  reloj: (t) => envoltorio('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>', t),

  cedula: (t) =>
    envoltorio(
      '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/>' +
      '<circle cx="8.5" cy="11" r="2.2"/>' +
      '<path d="M5 16.4c.7-1.5 2-2.2 3.5-2.2s2.8.7 3.5 2.2M14.5 10h4M14.5 13.5h4"/>',
      t
    ),

  edad: (t) =>
    envoltorio(
      '<circle cx="12" cy="6.5" r="3"/>' +
      '<path d="M7 20v-3.5a5 5 0 0 1 10 0V20M9.5 20h5"/>',
      t
    ),

  tabla: (t) =>
    envoltorio(
      '<rect x="3" y="3.5" width="18" height="17" rx="2.5"/>' +
      '<path d="M3 9h18M9 9v11.5M3 14.5h18"/>',
      t
    ),

  movil: (t) =>
    envoltorio(
      '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.8 18.6h2.4"/>',
      t
    ),

  globo: (t) =>
    envoltorio(
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M3.2 9.6h17.6M3.2 14.4h17.6"/>' +
      '<path d="M12 3c-2.4 2.4-3.6 5.4-3.6 9s1.2 6.6 3.6 9c2.4-2.4 3.6-5.4 3.6-9S14.4 5.4 12 3z"/>',
      t
    ),

  trofeo: (t) =>
    envoltorio(
      '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/>' +
      '<path d="M7 5.5H4.5V7A3.5 3.5 0 0 0 8 10.5M17 5.5h2.5V7A3.5 3.5 0 0 1 16 10.5"/>' +
      '<path d="M12 14v3.5M8.5 20.5h7l-.8-3h-5.4z"/>',
      t
    ),

  calendario: (t) =>
    envoltorio(
      '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/>' +
      '<path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="14.5" r="1.3" fill="currentColor" stroke="none"/>',
      t
    ),

  personas: (t) =>
    envoltorio(
      '<circle cx="9" cy="8" r="3.2"/>' +
      '<path d="M3 19.5a6 6 0 0 1 12 0"/>' +
      '<path d="M16.2 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.2a6 6 0 0 1 3.5 5.3"/>',
      t
    ),

  balon: (t) =>
    envoltorio(
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M12 7.4l3.4 2.5-1.3 4h-4.2l-1.3-4z"/>' +
      '<path d="M12 3v4.4M4.2 9.6l4.4 .3M19.8 9.6l-4.4 .3M7.6 20l2.3-3.7M16.4 20l-2.3-3.7"/>',
      t
    ),

  candado: (t) =>
    envoltorio(
      '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/>' +
      '<path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
      t
    ),

  rayo: (t) => envoltorio('<path d="M13.5 2.5 5 13.5h5.5L10 21.5 19 10.5h-5.5z"/>', t),
};
