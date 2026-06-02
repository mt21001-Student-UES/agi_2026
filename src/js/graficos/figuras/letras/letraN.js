import Circulo from "../Circulo.js";
import Linea from "../Linea.js";
import LetraInterface from "./letraInterface.js";

export default class LetraN extends LetraInterface {
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
      const diagonal = new Linea(`${this.id}_diagonal`, [
        h - size,
        k + size * 2,
        0,
        h + size,
        k - size,
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

      this.partes.push(lineaIzquierda, diagonal, lineaDerecha);

      if (this.opciones.virgulilla) {
        const virgulilla = new Linea(`${this.id}_virgulilla`, [
          h - size,
          k + size * 2.2,
          0,
          h + size,
          k + size * 2.2,
          0,
        ]);
        this.partes.push(virgulilla);
      }
    } else {
      // Minúscula
      const lineaIzquierda = new Linea(`${this.id}_lineaIzquierda`, [
        h - size,
        k - size,
        0,
        h - size,
        k + size * 0.5,
        0,
      ]);
      const circulo = new Circulo(`${this.id}_circulo`, h, k, size);
      circulo.setOctantes([true, true, true, true, false, false, false, false]);
      const lineaDerecha = new Linea(`${this.id}_lineaDerecha`, [
        h + size,
        k - size,
        0,
        h + size,
        k,
        0,
      ]);
      this.partes.push(lineaIzquierda, circulo, lineaDerecha);
      if (this.opciones.virgulilla) {
        const virgulilla = new Linea(`${this.id}_virgulilla`, [
          h - size,
          k + size * 1.5,
          0,
          h + size,
          k + size * 1.5,
          0,
        ]);
        this.partes.push(virgulilla);
      }
    }
  }
}
