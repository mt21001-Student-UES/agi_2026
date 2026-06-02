import FiguraInterface from "./figuraInterface.js";
import lineaBresenham from "../algoritmos/lineaBresenham.js";
import lineaDDA from "../algoritmos/lineaDDA.js";

export default class Linea extends FiguraInterface {
  #color;
  #algoritmo;
  #normalizadas;
  #dimensiones;
  #tamañoPunto;
  #vertices;

  /**
   * Clase para una sola línea
   * @param {string} id
   * @param {Array<number>} param1 Extremos de la línea [x0, y0, z0, x1, y1, z1]
   * @param {Array<number>} color Color de la línea [r, g, b]
   * @param {string} algoritmo Algoritmos disponibles:
   * - DDA
   * - Bresenham
   * @param {boolean} coordenadasNormalizadas Indicar al algoritmo tipo de coordenadas
   * - Normalizadas [-1, 1]
   * - Pixeles
   * @param {Array<number>} canvasDimensiones Las dimension del canvas [ancho, alto]
   * @param {number} tamañoPunto Requerido por los algoritmos
   */
  constructor(
    id,
    [x0, y0, z0, x1, y1, z1],
    color = [1, 1, 1],
    algoritmo = "bresenham",
    coordenadasNormalizadas = true,
    canvasDimensiones = [500, 500],
    tamañoPunto = 5,
  ) {
    super(id);
    this.#vertices = [x0, y0, z0, x1, y1, z1];
    this.#color = color;
    this.#algoritmo = algoritmo;
    this.#normalizadas = coordenadasNormalizadas;
    this.#tamañoPunto = tamañoPunto;
    this.#dimensiones = canvasDimensiones;
    console.log("Considerar hacer esto un factory para que sea mas limpio");
  }

  render() {
    const [x0, y0, z0, x1, y1, z1] = this.#vertices;

    let arr;
    if (this.#algoritmo.toLowerCase() === "bresenham") {
      console.log("Linea con algoritmo Bresenham");
      arr = lineaBresenham(
        x0,
        y0,
        x1,
        y1,
        this.#dimensiones[0],
        this.#dimensiones[1],
        this.#normalizadas,
      );
    } else if (this.#algoritmo.toLowerCase() === "dda") {
      console.log("Linea con algoritmo DDA");
      arr = lineaDDA(
        x0,
        y0,
        x1,
        y1,
        this.#dimensiones[0],
        this.#dimensiones[1],
        this.#tamañoPunto,
      );
    } else {
      throw new Error(`[Linea]: Algoritmo ${this.#algoritmo} no válido`);
    }

    // Construir buffer final
    if (!arr) {
      console.error("[Linea]: Error al calcular la línea");
    }
    const n = arr.length / 2;
    const pasoZ = (z1 - z0) / (n - 1);
    const buffer = [];
    for (let i = 0; i < n; i++) {
      buffer.push(
        arr[i * 2],
        arr[i * 2 + 1],
        z0 + i * pasoZ,
        this.#color[0],
        this.#color[1],
        this.#color[2],
      );
    }
    this.setBuffer(new Float32Array(buffer));
  }

  setColor(color) {
    this.#color = color;
    this.render();
  }
}
