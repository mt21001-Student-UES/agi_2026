import FiguraInterface from "./figuraInterface.js";
import lineaBresenham from "../algoritmos/lineaBresenham.js";
import lineaDDA from "../algoritmos/lineaDDA.js";

/**
 * Linea — Figura rasterizada en espacio de píxeles local.
 *
 * Genera los puntos de una línea usando DDA o Bresenham.
 * Todos los vértices se producen en píxeles (espacio local de la figura).
 * SistemaRender aplica Mat3.proyeccionNDC para convertirlos a NDC.
 *
 * Formato del buffer: [x, y, z, r, g, b, ...]
 */
export default class Linea extends FiguraInterface {
  #color;
  #algoritmo;
  #tamañoPunto;
  #vertices;

  /**
   * @param {string}   id
   * @param {number[]} vertices  [x0, y0, z0, x1, y1, z1] en píxeles locales
   * @param {number[]} color     [r, g, b] en [0,1]
   * @param {string}   algoritmo 'DDA' | 'Bresenham'
   * @param {number}   tamañoPunto Separación entre puntos (≈ tamaño del punto WebGL)
   */
  constructor(
    id,
    [x0, y0, z0, x1, y1, z1],
    color = [1, 1, 1],
    algoritmo = "Bresenham",
    tamañoPunto = 2,
  ) {
    super(id);
    this.#vertices    = [x0, y0, z0, x1, y1, z1];
    this.#color       = color;
    this.#algoritmo   = algoritmo;
    this.#tamañoPunto = tamañoPunto;
  }

  render() {
    const [x0, y0, z0, x1, y1, z1] = this.#vertices;

    let arr; // pares planos [x, y, x, y, ...]
    const algo = this.#algoritmo.toLowerCase();

    if (algo === "bresenham") {
      arr = lineaBresenham(x0, y0, x1, y1);
    } else if (algo === "dda") {
      arr = lineaDDA(x0, y0, x1, y1, this.#tamañoPunto);
    } else {
      throw new Error(`[Linea] Algoritmo desconocido: '${this.#algoritmo}'`);
    }

    if (!arr || arr.length < 2) {
      console.error("[Linea] Sin vértices generados");
      this.setBuffer(new Float32Array(0));
      return;
    }

    // Construir buffer interleaved [x, y, z, r, g, b]
    const n = arr.length / 2;
    const pasoZ = n > 1 ? (z1 - z0) / (n - 1) : 0;
    const buffer = new Float32Array(n * 6);

    for (let i = 0; i < n; i++) {
      const base = i * 6;
      buffer[base]     = arr[i * 2];       // x px local
      buffer[base + 1] = arr[i * 2 + 1];  // y px local
      buffer[base + 2] = z0 + i * pasoZ;  // z interpolado
      buffer[base + 3] = this.#color[0];
      buffer[base + 4] = this.#color[1];
      buffer[base + 5] = this.#color[2];
    }
    this.setBuffer(buffer);
  }

  setColor(color) {
    this.#color = color;
    this.render();
  }
}

