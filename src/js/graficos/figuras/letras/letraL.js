import Linea from "../Linea.js";
import LetraInterface from "./letraInterface.js";

export default class LetraL extends LetraInterface {
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
      const lineaAbajo = new Linea(`${this.id}_lineaAbajo`, [
        h - size,
        k - size,
        0,
        h + size,
        k - size,
        0,
      ]);

      this.partes.push(lineaIzquierda, lineaAbajo);
    } else {
      // Minúscula
      const linea = new Linea(`${this.id}_linea`, [
        h,
        k - size,
        0,
        h,
        k + size * 2,
        0,
      ]);
      this.partes.push(linea);
    }
  }
}
