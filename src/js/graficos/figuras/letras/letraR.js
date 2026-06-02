import Circulo from "../Circulo.js";
import Linea from "../Linea.js";
import LetraInterface from "./letraInterface.js";

export default class LetraR extends LetraInterface {
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
        k + size,
        size * 1.3
      );
      circulo.setOctantes([true, true, true, false, false, true, true, true]);
      const lineaIzquierda = new Linea(`${this.id}_lineaIzquierda`, [
        h - size,
        k + size * 2,
        0,
        h - size,
        k - size,
        0,
      ]);
      const diagonal = new Linea(`${this.id}_diagonal`, [
        h - size,
        k,
        0,
        h + size,
        k - size,
        0,
      ]);
      this.partes.push(circulo, lineaIzquierda, diagonal);
    } else {
      // Minúscula
      const lineaIzquierda = new Linea(`${this.id}_lineaIzquierda`, [
        h - size,
        k + size,
        0,
        h - size,
        k - size,
        0,
      ]);
      const circulo = new Circulo(`${this.id}_circulo`, h, k, size);
      circulo.setOctantes([
        false,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
      ]);
      this.partes.push(lineaIzquierda, circulo);
    }
  }
}
