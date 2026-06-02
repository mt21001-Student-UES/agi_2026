/**
 * @param {number} x0 - Coordenada X inicial.
 * @param {number} y0 - Coordenada Y inicial.
 * @param {number} x1 - Coordenada X final.
 * @param {number} y1 - Coordenada Y final.
 * @param {number} canvasAncho - Ancho actual del canvas en píxeles.
 * @param {number} canvasAlto - Alto actual del canvas en píxeles.
 * @param {boolean} normalizadas - true si las coordenadas están en [-1,1], false si ya están en píxeles.
 * @returns {Float32Array} - Lista de vértices con formato [x, y].
 */
export default function lineaBresenham(
  x0,
  y0,
  x1,
  y1,
  canvasAncho,
  canvasAlto,
  normalizadas = true
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

  //console.log("Coordenadas: ", normalizadas, x0, y0, x1, y1);

  let puntos = [];

  // Convertir a píxeles si vienen en normalizadas (-1 a 1)
  if (normalizadas) {
    x0 = ((x0 + 1) / 2) * canvasAncho;
    y0 = ((1 - y0) / 2) * canvasAlto;
    x1 = ((x1 + 1) / 2) * canvasAncho;
    y1 = ((1 - y1) / 2) * canvasAlto;
  }

  // Redondear a enteros
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);

  // Diferencias absolutas
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);

  // Dirección de avance
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;

  // Error inicial
  let err = dx - dy;

  // Bucle principal
  while (true) {
    // Convertir cada punto a coordenadas normalizadas para WebGL
    let normalX = (2 * x0) / canvasAncho - 1;
    let normalY = 1 - (2 * y0) / canvasAlto;

    // Guardar vértice
    puntos.push(normalX, normalY);

    // Condición de salida
    if (x0 === x1 && y0 === y1) break;

    let e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return new Float32Array(puntos);
}
