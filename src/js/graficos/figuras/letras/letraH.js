import Linea from "../Linea.js";
import Circulo from "../Circulo.js";
import LetraInterface from "./letraInterface.js";

export default class LetraH extends LetraInterface {
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
      const lineaIzquierda = new Linea(`${this.id}_lineaIzquierda`, [
        h - size,
        k - size,
        0,
        h - size,
        k + size * 2,
        0,
      ]);
      const lineaCentro = new Linea(`${this.id}_lineaCentro`, [
        h - size,
        k + size * 0.5,
        0,
        h + size,
        k + size * 0.5,
        0,
      ]);
      const lineaDerecha = new Linea(`${this.id}_lineaDerecha`, [
        h + size,
        k - size,
        0,
        h + size,
        k + size * 2,
        0,
      ]);
      this.partes.push(lineaIzquierda, lineaCentro, lineaDerecha);
    } else {
      // Minúscula
      const lineaIzquierda = new Linea(`${this.id}_lineaIzquierda`, [
        h - size,
        k - size,
        0,
        h - size,
        k + size * 2,
        0,
      ]);
      const circuloAbajo = new Circulo(
        `${this.id}_circuloAbajo`,
        h,
        k,
        size
      );
      circuloAbajo.setOctantes([
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
      ]);
      const lineaDerecha = new Linea(`${this.id}_lineaDerecha`, [
        h + size,
        k - size,
        0,
        h + size,
        k,
        0,
      ]);
      this.partes.push(lineaIzquierda, circuloAbajo, lineaDerecha);
    }
  }
}
