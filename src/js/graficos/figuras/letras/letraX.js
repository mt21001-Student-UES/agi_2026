import Linea from "../Linea.js";
import LetraInterface from "./letraInterface.js";

export default class LetraX extends LetraInterface {
  constructor(
    id,
    posicion = { x: 0, y: 0, z: 0 },
    opciones = {
      tamaño: 1,
      mayuscula: true,
      color: [1, 1, 1],
      algoritmoLinea: "bresenham",
    },
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
      const lineaIzquierda = new Linea(
        `${this.id}_lineaIzquierda`,
        [h - size, k + size * 2, 0, h + size, k - size, 0],
        this.opciones.color,
        this.opciones.algoritmoLinea,
      );
      const lineaDerecha = new Linea(
        `${this.id}_lineaDerecha`,
        [h + size, k + size * 2, 0, h - size, k - size, 0],
        this.opciones.color,
        this.opciones.algoritmoLinea,
      );
      this.partes.push(lineaIzquierda, lineaDerecha);
    } else {
      // Minúscula
      const lineaIzquierda = new Linea(
        `${this.id}_lineaIzquierda`,
        [h - size, k + size, 0, h + size, k - size, 0],
        this.opciones.color,
        this.opciones.algoritmoLinea,
      );
      const lineaDerecha = new Linea(
        `${this.id}_lineaDerecha`,
        [h + size, k + size, 0, h - size, k - size, 0],
        this.opciones.color,
        this.opciones.algoritmoLinea,
      );
      this.partes.push(lineaIzquierda, lineaDerecha);
    }
  }
}
