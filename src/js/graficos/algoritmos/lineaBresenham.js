/**
 * Algoritmo de Bresenham — Espacio de píxeles local.
 *
 * Traza una línea entera entre (x0,y0) y (x1,y1) en coordenadas de PÍXELES.
 * SistemaRender aplica Mat3.proyeccionNDC para pasar a NDC antes de la GPU.
 *
 * @param {number} x0 Coordenada X inicial en píxeles
 * @param {number} y0 Coordenada Y inicial en píxeles
 * @param {number} x1 Coordenada X final en píxeles
 * @param {number} y1 Coordenada Y final en píxeles
 * @returns {Float32Array} Lista plana de pares [x, y] en píxeles (enteros)
 */
export default function lineaBresenham(x0, y0, x1, y1) {
  if (
    typeof x0 !== "number" ||
    typeof y0 !== "number" ||
    typeof x1 !== "number" ||
    typeof y1 !== "number"
  ) {
    console.warn("[lineaBresenham] Coordenadas inválidas:", x0, y0, x1, y1);
    return new Float32Array(0);
  }

  const puntos = [];

  // Redondear a enteros (Bresenham trabaja en cuadrícula discreta)
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);

  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);

  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;

  let err = dx - dy;

  while (true) {
    puntos.push(x0, y0);

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 <  dx) { err += dx; y0 += sy; }
  }

  return new Float32Array(puntos);
}

