import Linea from "../Linea.js";
import Circulo from "../Circulo.js";
import LetraInterface from "./letraInterface.js";

export default class LetraC extends LetraInterface {
  constructor(
    id,
    posicion = { x: 0, y: 0, z: 0 },
    opciones = { tamaño: 1, mayuscula: true }
  ) {
    super(id, posicion, opciones);
    this.#init();
  }

  #init() {
    const h = this.posicion.x; // centro X
    const k = this.posicion.y; // centro Y
    const size = this.opciones.tamaño; // escala relativa al tamaño de la casilla

    if (this.opciones.mayuscula) {
      // Mayúscula
      const circulo = new Circulo(
        `${this.id}_circulo`,
        h,
        k + size * 0.5,
        size * 1.5
      );
      circulo.setOctantes([false, true, true, true, true, true, true, false]);

      this.partes.push(circulo);
    } else {
      // Minúscula
      const circulo = new Circulo(`${this.id}_circulo`, h, k, size);
      circulo.setOctantes([false, true, true, true, true, true, true, false]);

      this.partes.push(circulo);
    }
  }
}
