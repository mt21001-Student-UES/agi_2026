import Circulo from "../Circulo.js";
import LetraInterface from "./letraInterface.js";

export default class LetraS extends LetraInterface {
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
      const circuloArriba = new Circulo(
        `${this.id}_circuloArriba`,
        h,
        k + size * 1.25,
        size * 0.75
      );
      circuloArriba.setOctantes([
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        false,
      ]);
      const circuloAbajo = new Circulo(
        `${this.id}_circuloAbajo`,
        h,
        k - size * 0.25,
        size * 0.75
      );
      circuloAbajo.setOctantes([
        true,
        true,
        false,
        false,
        true,
        true,
        true,
        true,
      ]);

      this.partes.push(circuloArriba, circuloAbajo);
    } else {
      // Minúscula
      const circuloArriba = new Circulo(
        `${this.id}_circuloArriba`,
        h,
        k + size * 0.5,
        size * 0.5
      );
      circuloArriba.setOctantes([
        true,
        true,
        true,
        true,
        true,
        true,
        false,
        false,
      ]);
      const circuloAbajo = new Circulo(
        `${this.id}_circuloAbajo`,
        h,
        k - size * 0.5,
        size * 0.5
      );
      circuloAbajo.setOctantes([
        true,
        true,
        false,
        false,
        true,
        true,
        true,
        true,
      ]);
      this.partes.push(circuloArriba, circuloAbajo);
    }
  }
}
