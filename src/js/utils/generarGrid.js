/**
 * Genera coordenadas normalizadas para un grid
 * @param {number} columnas Número de columnas
 * @param {number} filas Número de filas
 * @param {number} ancho Canvas width en píxeles
 * @param {number} alto Canvas height en píxeles
 * @returns {Float32Array} Coordenadas normalizadas [x,y,z,r,g,b,...]
 */
export default function generarGrid(columnas, filas, ancho, alto) {
  if (!columnas || !filas) {
    throw new Error("Columnas o filas inválidas: ", columnas, filas);
  } else if (!ancho || !alto) {
    throw new Error("Dimensiones inválidas: ", ancho, alto);
  }

  const coords = [];

  // Tamaño de cada celda en píxeles
  const cellWidth = ancho / columnas;
  const cellHeight = alto / filas;

  for (let i = 0; i < filas; i++) {
    for (let j = 0; j < columnas; j++) {
      // Centro de la celda en píxeles
      const cx = j * cellWidth + cellWidth / 2;
      const cy = i * cellHeight + cellHeight / 2;

      // Convertir a coordenadas normalizadas (-1 a 1)
      const nx = (cx / ancho) * 2 - 1; // map [0,ancho] → [-1,1]
      const ny = (cy / alto) * 2 - 1; // map [0,alto] → [-1,1]

      coords.push(nx, ny);
    }
  }

  return new Float32Array(coords);
}
