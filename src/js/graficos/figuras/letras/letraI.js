import Linea from "../Linea.js";
import LetraInterface from "./letraInterface.js";
import Puntos from "../Puntos.js";

export default class LetraI extends LetraInterface {
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
      const lineaArriba = new Linea(`${this.id}_lineaArriba`, [
        h - size,
        k + size * 2,
        0,
        h + size,
        k + size * 2,
        0,
      ]);
      const lineaCentro = new Linea(`${this.id}_lineaCentro`, [
        h,
        k + size * 2,
        0,
        h,
        k - size,
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
      this.partes.push(lineaArriba, lineaCentro, lineaAbajo);
    } else {
      // Minúscula
      const lineaCentro = new Linea(`${this.id}_lineaCentro`, [
        h,
        k + size,
        0,
        h,
        k - size,
        0,
      ]);

      const punto = new Puntos(`${this.id}_punto`, [
        h,
        k + size * 1.5,
        0,
        1,
        1,
        1,
      ]);
      this.partes.push(lineaCentro, punto);
    }
  }
}
