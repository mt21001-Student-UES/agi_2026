import Circulo from "../Circulo.js";
import Linea from "../Linea.js";
import LetraInterface from "./letraInterface.js";

export default class LetraM extends LetraInterface {
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
      const diagonalIzquierda = new Linea(`${this.id}_diagonalIzquierda`, [
        h,
        k,
        0,
        h - size,
        k + size * 2,
        0,
      ]);
      const diagonalDerecha = new Linea(`${this.id}_diagonalDerecha`, [
        h,
        k,
        0,
        h + size,
        k + size * 2,
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

      this.partes.push(
        lineaIzquierda,
        diagonalIzquierda,
        diagonalDerecha,
        lineaDerecha
      );
    } else {
      // Minúscula
      const lineaIzquierda = new Linea(`${this.id}_lineaIzquierda`, [
        h - size,
        k - size,
        0,
        h - size,
        k + size,
        0,
      ]);
      const circuloIzquierda = new Circulo(
        `${this.id}_circuloIzquierda`,
        h - size * 0.5,
        k + size * 0.5,
        size * 0.5
      );
      circuloIzquierda.setOctantes([
        true,
        true,
        true,
        true,
        false,
        false,
        false,
        false,
      ]);
      const circuloDerecha = new Circulo(
        `${this.id}_circuloDerecha`,
        h + size * 0.5,
        k + size * 0.5,
        size * 0.5
      );
      circuloDerecha.setOctantes([
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
        k + size * 0.5,
        0,
      ]);
      this.partes.push(
        lineaIzquierda,
        circuloIzquierda,
        circuloDerecha,
        lineaDerecha
      );
    }
  }
}
