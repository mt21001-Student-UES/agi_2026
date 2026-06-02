import Linea from "../Linea.js";
import Circulo from "../Circulo.js";
import LetraInterface from "./letraInterface.js";

export default class LetraE extends LetraInterface {
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
      const lineaDerecha = new Linea(`${this.id}_lineaDerecha`, [
        h - size,
        k - size,
        0,
        h - size,
        k + size * 2,
        0,
      ]);
      const lineaArriba = new Linea(`${this.id}_lineaArriba`, [
        h - size,
        k + size * 2,
        0,
        h + size,
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
      const lineaAbajo = new Linea(`${this.id}_lineaAbajo`, [
        h - size,
        k - size,
        0,
        h + size,
        k - size,
        0,
      ]);
      this.partes.push(lineaDerecha, lineaArriba, lineaCentro, lineaAbajo);
    } else {
      // Minúscula
      const circulo = new Circulo(`${this.id}_circulo`, h, k, size);
      circulo.setOctantes([true, true, true, true, true, true, true, false]);
      const linea = new Linea(`${this.id}_linea`, [
        h - size,
        k,
        0,
        h + size,
        k ,
        0,
      ]);
      this.partes.push(circulo, linea);
    }
  }
}
