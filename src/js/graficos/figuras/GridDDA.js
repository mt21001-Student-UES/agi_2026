import FiguraInterface from "./figuraInterface.js";
import Linea from "./Linea.js";

export default class GridDDA extends FiguraInterface {
  constructor(id, filas, columnas, color = [1, 1, 1]) {
    super(id);
    this.filas = filas;
    this.columnas = columnas;
    this.color = color;
    this.anchoCelda = 2.0 / columnas; // ancho depende de columnas
    this.altoCelda = 2.0 / filas; // alto depende de filas
  }

  render() {
    const buffers = [];

    // Lineas horizontales (filas + 1)
    const pasoY = 2.0 / this.filas;
    for (let i = 0; i <= this.filas; i++) {
      const y = 1.0 - i * pasoY; // De arriba (1.0) hacia abajo (-1.0)
      const lineaH = new Linea(
        `${this.id}_h${i}`,
        [-1.0, y, 0.0, 1.0, y, 0.0],
        this.color,
        "DDA",
      );
      lineaH.render();
      buffers.push(lineaH.getBuffer());
    }

    // Lineas verticales (columnas + 1)
    const pasoX = 2.0 / this.columnas;
    for (let i = 0; i <= this.columnas; i++) {
      const x = -1.0 + i * pasoX; // De izquierda (-1.0) a derecha (1.0)
      const lineaV = new Linea(
        `${this.id}_v${i}`,
        [x, -1.0, 0.0, x, 1.0, 0.0],
        this.color,
        "DDA",
      );
      lineaV.render();
      buffers.push(lineaV.getBuffer());
    }

    // Concatenar todos los buffers en uno solo
    let totalLength = 0;
    for (const b of buffers) {
      if (b) totalLength += b.length;
    }

    const bufferFinal = new Float32Array(totalLength);
    let offset = 0;
    for (const b of buffers) {
      if (b) {
        bufferFinal.set(b, offset);
        offset += b.length;
      }
    }

    this.setBuffer(bufferFinal);
  }

  /**
   * Obtiene las dimensiones de una casilla del grid, en coordenadas normalizadas.
   * @returns {Array<number>} [anchoCelda, altoCelda]
   */
  get tamanoCelda() {
    return [this.anchoCelda, this.altoCelda];
  }
}
