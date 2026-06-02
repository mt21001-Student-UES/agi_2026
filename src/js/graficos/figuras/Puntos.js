import FiguraInterface from "./figuraInterface.js";

export default class Puntos extends FiguraInterface {
  #puntos;
  /**
   *
   * @param {string} id
   * @param {Array<number>} puntos
   */
  constructor(id, puntos = []) {
    super(id);
    this.#puntos = puntos;
  }

  agregarPuntos(puntos) {
    if (!Array.isArray(puntos)) {
      console.warn("Puntos Inválidos");
      return;
    }
    this.#puntos.push(puntos);
  }

  render() {
    this.setBuffer(this.#puntos);
  }

  trasladar(dx, dy, dz) {
    this.#puntos = this.#puntos.map(([x, y, z]) => [x + dx, y + dy, z + dz]);
  }
}
