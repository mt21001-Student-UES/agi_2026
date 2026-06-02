import Linea from "../Linea.js";
import Circulo from "../Circulo.js";
import LetraInterface from "./letraInterface.js";
import Puntos from "../Puntos.js";

export default class LetraJ extends LetraInterface {
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
      const circuloAbajo = new Circulo(
        `${this.id}_circuloAbajo`,
        h - size,
        k - size,
        size
      );
      circuloAbajo.setOctantes([
        false,
        false,
        false,
        false,
        false,
        false,
        true,
        true,
      ]);

      this.partes.push(lineaArriba, lineaCentro, circuloAbajo);
    } else {
      // Minúscula
      const lineaCentro = new Linea(`${this.id}_lineaCentro`, [
        h + size,
        k + size,
        0,
        h + size,
        k - size * 1.5,
        0,
      ]);

      const punto = new Puntos(`${this.id}_punto`, [
        h + size,
        k + size * 1.5,
        0,
        1,
        1,
        1,
      ]);
      const circuloAbajo = new Circulo(
        `${this.id}_circuloAbajo`,
        h,
        k - size * 1.5,
        size,
        40
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
      this.partes.push(lineaCentro, punto, circuloAbajo);
    }
  }
}
