import Linea from "../Linea.js";
import Circulo from "../Circulo.js";
import LetraInterface from "./letraInterface.js";

export default class LetraA extends LetraInterface {
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
      // Mayúscula A
      const diagonalIzq = new Linea(`${this.id}_diagonalIzq`, [
        h - size,
        k - size,
        0,
        h,
        k + size * 2,
        0,
      ]);
      const diagonalDer = new Linea(`${this.id}_diagonalDer`, [
        h + size,
        k - size,
        0,
        h,
        k + size * 2,
        0,
      ]);
      const lineaCentro = new Linea(`${this.id}_lineaCentro`, [
        h - size / 2,
        k,
        0,
        h + size / 2,
        k,
        0,
      ]);
      this.partes.push(diagonalIzq, diagonalDer, lineaCentro);
    } else {
      // Minúscula
      const circulo = new Circulo(`${this.id}_circulo`, h, k, size);
      const lineaDerecha = new Linea(`${this.id}_lineaDerecha`, [
        h + size,
        k - size,
        0,
        h + size,
        k + size,
        0,
      ]);
      this.partes.push(circulo, lineaDerecha);
    }
  }
}
