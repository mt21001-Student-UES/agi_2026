import Linea from "../Linea.js";
import Circulo from "../Circulo.js";
import LetraInterface from "./letraInterface.js";

export default class LetraG extends LetraInterface {
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
      circulo.setOctantes([false, true, true, true, true, true, true, true]);
      const lineaCentro = new Linea(`${this.id}_lineaCentro`, [
        h,
        k + size * 0.5,
        0,
        h + size * 1.5,
        k + size * 0.5,
        0,
      ]);
      this.partes.push(circulo, lineaCentro);
    } else {
      // Minúscula
      const circulo = new Circulo(`${this.id}_circulo`, h, k, size);
      const circuloAbajo = new Circulo(
        `${this.id}_circuloAbajo`,
        h,
        k - size * 1.5,
        size
      );
      circuloAbajo.setOctantes([
        false,
        false,
        false,
        false,
        true,
        true,
        true,
        true,
      ]);
      const lineaDerecha = new Linea(`${this.id}_lineaDerecha`, [
        h + size,
        k - size * 1.5,
        0,
        h + size,
        k + size,
        0,
      ]);
      this.partes.push(circulo, lineaDerecha, circuloAbajo);
    }
  }
}
