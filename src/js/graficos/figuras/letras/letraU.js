import Circulo from "../Circulo.js";
import Linea from "../Linea.js";
import Puntos from "../Puntos.js";
import LetraInterface from "./letraInterface.js";

export default class LetraU extends LetraInterface {
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
        k,
        0,
        h - size,
        k + size * 2,
        0,
      ]);
      const circulo = new Circulo(`${this.id}_circulo`, h, k, size);
      circulo.setOctantes([false, false, false, false, true, true, true, true]);
      const lineaDerecha = new Linea(`${this.id}_lineaDerecha`, [
        h + size,
        k,
        0,
        h + size,
        k + size * 2,
        0,
      ]);
      this.partes.push(lineaIzquierda, circulo, lineaDerecha);
      if (this.opciones.dieresis) {
        const dieresis = new Puntos(`${this.id}_dieresis`, [
          h - size,
          k + size * 2.5,
          0,
          1,
          1,
          1,
          h + size,
          k + size * 2.5,
          0,
          1,
          1,
          1,
        ]);
        this.partes.push(dieresis);
      }
    } else {
      // Minúscula
      const lineaIzquierda = new Linea(`${this.id}_lineaIzquierda`, [
        h - size,
        k,
        0,
        h - size,
        k + size,
        0,
      ]);
      const circulo = new Circulo(`${this.id}_circulo`, h, k, size);
      circulo.setOctantes([false, false, false, false, true, true, true, true]);
      const lineaDerecha = new Linea(`${this.id}_lineaDerecha`, [
        h + size,
        k - size,
        0,
        h + size,
        k + size,
        0,
      ]);
      this.partes.push(lineaIzquierda, circulo, lineaDerecha);
      if (this.opciones.dieresis) {
        const dieresis = new Puntos(`${this.id}_dieresis`, [
          h - size,
          k + size * 1.5,
          0,
          1,
          1,
          1,
          h + size,
          k + size * 1.5,
          0,
          1,
          1,
          1,
        ]);
        this.partes.push(dieresis);
      }
    }
  }
}
