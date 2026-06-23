import FiguraInterface from "./figuraInterface.js";
import Linea from "./Linea.js";

/**
 * GridDDA — Tablero de juego rasterizado en espacio de píxeles local.
 *
 * Genera (filas+1)+(columnas+1) líneas DDA centradas en el origen (0,0).
 * El TransformComponent posiciona el tablero en escena.
 * SistemaRender aplica Mat3.proyeccionNDC para convertir a NDC.
 */
export default class GridDDA extends FiguraInterface {
  /**
   * @param {string}   id
   * @param {number}   filas
   * @param {number}   columnas
   * @param {number}   anchoPx   Ancho total del tablero en píxeles canvas
   * @param {number}   altoPx    Alto total del tablero en píxeles canvas
   * @param {number[]} [color]   [r, g, b]
   */
  constructor(id, filas, columnas, anchoPx, altoPx, color = [1, 1, 1]) {
    super(id);
    this.filas    = filas;
    this.columnas = columnas;
    this.anchoPx  = anchoPx;
    this.altoPx   = altoPx;
    this.color    = color;

    // Tamaño de celda en píxeles (para que SistemaEntradaGrid los use)
    this.anchoCelda = anchoPx / columnas;
    this.altoCelda  = altoPx  / filas;
  }

  render() {
    const buffers = [];
    const w = this.anchoPx;
    const h = this.altoPx;

    // Extremos locales: centrado en (0,0)
    const xMin = -w / 2;
    const xMax =  w / 2;
    const yMin = -h / 2;
    const yMax =  h / 2;

    // Líneas horizontales (filas + 1)
    for (let i = 0; i <= this.filas; i++) {
      const y = yMin + i * this.altoCelda;
      const linea = new Linea(
        `${this.id}_h${i}`,
        [xMin, y, 0, xMax, y, 0],
        this.color,
        "DDA",
        2,   // tamañoPunto (separación entre puntos DDA)
      );
      linea.render();
      if (linea.getBuffer()) buffers.push(linea.getBuffer());
    }

    // Líneas verticales (columnas + 1)
    for (let i = 0; i <= this.columnas; i++) {
      const x = xMin + i * this.anchoCelda;
      const linea = new Linea(
        `${this.id}_v${i}`,
        [x, yMin, 0, x, yMax, 0],
        this.color,
        "DDA",
        2,
      );
      linea.render();
      if (linea.getBuffer()) buffers.push(linea.getBuffer());
    }

    // Concatenar todos los buffers en uno
    const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
    const bufferFinal = new Float32Array(totalLength);
    let offset = 0;
    for (const b of buffers) {
      bufferFinal.set(b, offset);
      offset += b.length;
    }
    this.setBuffer(bufferFinal);
  }

  /**
   * Tamaño de celda en píxeles.
   * @returns {[number, number]} [anchoCelda, altoCelda]
   */
  get tamanoCelda() {
    return [this.anchoCelda, this.altoCelda];
  }
}

