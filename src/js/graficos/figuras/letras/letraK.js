import Linea from "../Linea.js";
import LetraInterface from "./letraInterface.js";

export default class LetraK extends LetraInterface {
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
      const diagonalArriba = new Linea(`${this.id}_diagonalArriba`, [
        h - size,
        k + size * 0.5,
        0,
        h + size,
        k + size * 2,
        0,
      ]);
      const diagonalAbajo = new Linea(`${this.id}_diagonalAbajo`, [
        h - size,
        k + size * 0.5,
        0,
        h + size,
        k - size,
        0,
      ]);
      this.partes.push(lineaIzquierda, diagonalArriba, diagonalAbajo);
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
      const diagonalArriba = new Linea(`${this.id}_diagonalArriba`, [
        h - size,
        k,
        0,
        h + size * 0.5,
        k + size,
        0,
      ]);
      const diagonalAbajo = new Linea(`${this.id}_diagonalAbajo`, [
        h - size,
        k,
        0,
        h + size * 0.5,
        k - size,
        0,
      ]);
      this.partes.push(lineaIzquierda, diagonalArriba, diagonalAbajo);
    }
  }
}
