/**
 * Algoritmo DDA — Espacio de píxeles local.
 *
 * Genera los puntos de una línea entre (x0,y0) y (x1,y1) en coordenadas
 * de PÍXELES (no NDC). SistemaRender aplica Mat3.proyeccionNDC al final.
 *
 * @param {number} x0          Coordenada X inicial en píxeles
 * @param {number} y0          Coordenada Y inicial en píxeles
 * @param {number} x1          Coordenada X final en píxeles
 * @param {number} y1          Coordenada Y final en píxeles
 * @param {number} tamañoPunto Separación entre puntos (≈ tamaño del punto WebGL)
 * @returns {number[]} Lista plana de pares [x, y] en píxeles
 */
export default function lineaDDA(x0, y0, x1, y1, tamañoPunto = 1) {
  if (
    typeof x0 !== "number" ||
    typeof y0 !== "number" ||
    typeof x1 !== "number" ||
    typeof y1 !== "number"
  ) {
    console.warn("[lineaDDA] Coordenadas inválidas:", x0, y0, x1, y1);
    return [];
  }

  const puntos = [];
  const dx = x1 - x0;
  const dy = y1 - y0;

  // Nº de pasos proporcional a la distancia euclidiana en px / tamaño del punto
  const distancia = Math.sqrt(dx * dx + dy * dy);
  const pasos = Math.max(1, Math.ceil(distancia / tamañoPunto));

  const xInc = dx / pasos;
  const yInc = dy / pasos;

  let x = x0;
  let y = y0;

  for (let i = 0; i <= pasos; i++) {
    puntos.push(x, y);
    x += xInc;
    y += yInc;
  }

  return puntos;
}

