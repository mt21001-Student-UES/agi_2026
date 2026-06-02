/**
 * Algoritmo DDA adaptado para coordenadas normalizadas y canvas dinámico.
 *
 * @param {number} x0 - Coordenada X inicial (normalizada entre 0 y 1).
 * @param {number} y0 - Coordenada Y inicial (normalizada entre 0 y 1).
 * @param {number} x1 - Coordenada X final (normalizada entre 0 y 1).
 * @param {number} y1 - Coordenada Y final (normalizada entre 0 y 1).
 * @param {number} canvasAncho - Ancho actual del canvas en píxeles.
 * @param {number} canvasAlto - Alto actual del canvas en píxeles.
 * @param {number} tamañoPunto - Tamaño de cada punto en píxeles (diámetro aproximado).
 * @param {Array<number>} color - Color en formato [r, g, b], valores entre 0 y 1.
 * @returns {Array<number>} - Lista de vértices con formato [x, y, z, r, g, b].
 *
 * - Se normalizan las coordenadas (0–1) y luego se escalan al tamaño del canvas.
 * - El número de pasos se calcula como la distancia máxima en píxeles / tamaño del punto.
 * - Esto asegura que no haya huecos entre puntos al escalar el canvas.
 */
export default function lineaDDA(
  x0,
  y0,
  x1,
  y1,
  canvasAncho,
  canvasAlto,
  tamañoPunto = 1
) {
  if (
    typeof x0 !== "number" ||
    typeof y0 !== "number" ||
    typeof x1 !== "number" ||
    typeof y1 !== "number"
  ) {
    console.warn("Coordenadas inválidas: ", x0, y0, x1, y1);
    return;
  }

  const puntos = [];

  // Escalar coordenadas normalizadas al tamaño real del canvas
  const x0_px = x0 * canvasAncho;
  const y0_px = y0 * canvasAlto;
  const x1_px = x1 * canvasAncho;
  const y1_px = y1 * canvasAlto;

  const dx = x1_px - x0_px;
  const dy = y1_px - y0_px;

  // Distancia euclidiana en píxeles
  const distancia = Math.sqrt(dx * dx + dy * dy);

  // Número de pasos: distancia / tamaño del punto
  // Esto asegura que cada punto esté separado aproximadamente por "tamañoPunto"
  const pasos = Math.max(1, Math.ceil(distancia / tamañoPunto));

  // Incrementos por paso
  const xInc = dx / pasos;
  const yInc = dy / pasos;

  let x = x0_px;
  let y = y0_px;

  for (let i = 0; i <= pasos; i++) {
    // Normalizar de nuevo a [0,1] para mantener independencia del canvas
    const xNorm = x / canvasAncho;
    const yNorm = y / canvasAlto;

    puntos.push(xNorm, yNorm);

    x += xInc;
    y += yInc;
  }

  //console.log("Puntos de la linea: ", puntos);
  return puntos;
}
