import Linea from "../Linea.js";
import Circulo from "../Circulo.js";
import LetraInterface from "./letraInterface.js";

export default class LetraB extends LetraInterface {
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
      const circuloAbajo = new Circulo(
        `${this.id}_circuloAbajo`,
        h,
        k - size * 0.2,
        size
      );
      circuloAbajo.setOctantes([
        true,
        false,
        false,
        false,
        true,
        true,
        true,
        true,
      ]);
      const circuloArriba = new Circulo(
        `${this.id}_circuloArriba`,
        h,
        k + size * 1.2,
        size
      );
      circuloArriba.setOctantes([
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        true,
      ]);
      const lineaCentro = new Linea(`${this.id}_lineaCentro`, [
        h - size,
        k + size / 2,
        0,
        h + size * 0.8,
        k + size / 2,
        0,
      ]);
      const lineaIzquierda = new Linea(`${this.id}_lineaIzquierda`, [
        h - size,
        k - size,
        0,
        h - size,
        k + size * 2,
        0,
      ]);
      this.partes.push(circuloArriba, circuloAbajo, lineaIzquierda, lineaCentro);
    } else {
      // Minúscula
      const circulo = new Circulo(`${this.id}_circulo`, h, k, size);
      const linea = new Linea(`${this.id}_linea`, [
        h - size,
        k - size,
        0,
        h - size,
        k + size * 2,
        0,
      ]);
      this.partes.push(circulo, linea);
    }
  }
}
