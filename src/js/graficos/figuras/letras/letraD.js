import Linea from "../Linea.js";
import Circulo from "../Circulo.js";
import LetraInterface from "./letraInterface.js";

export default class LetraD extends LetraInterface {
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
      circulo.setOctantes([true, true, true, false, false, true, true, true]);
      const linea = new Linea(`${this.id}_linea`, [
        h - size,
        k - size,
        0,
        h - size,
        k + size * 2,
        0,
      ]);
      this.partes.push(circulo, linea);
    } else {
      // Minúscula
      const circulo = new Circulo(`${this.id}_circulo`, h, k, size);
      const linea = new Linea(`${this.id}_linea`, [
        h + size,
        k - size,
        0,
        h + size,
        k + size * 2,
        0,
      ]);
      this.partes.push(circulo, linea);
    }
  }
}
