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
      algoritmoLinea: "Bresenham",
    },
  ) {
    super(id, posicion, opciones);
    this.#init();
  }

  #init() {
    const size = this.opciones.tamaño; // tamaño en píxeles

    // Centrado en (0,0) local
    if (this.opciones.mayuscula) {
      // Mayúscula
      const lineaIzquierda = new Linea(
        `${this.id}_lineaIzquierda`,
        [-size, size * 2, 0, size, -size, 0],
        this.opciones.color,
        this.opciones.algoritmoLinea,
        2, // tamañoPunto
      );
      const lineaDerecha = new Linea(
        `${this.id}_lineaDerecha`,
        [size, size * 2, 0, -size, -size, 0],
        this.opciones.color,
        this.opciones.algoritmoLinea,
        2,
      );
      this.partes.push(lineaIzquierda, lineaDerecha);
    } else {
      // Minúscula
      const lineaIzquierda = new Linea(
        `${this.id}_lineaIzquierda`,
        [-size, size, 0, size, -size, 0],
        this.opciones.color,
        this.opciones.algoritmoLinea,
        2,
      );
      const lineaDerecha = new Linea(
        `${this.id}_lineaDerecha`,
        [size, size, 0, -size, -size, 0],
        this.opciones.color,
        this.opciones.algoritmoLinea,
        2,
      );
      this.partes.push(lineaIzquierda, lineaDerecha);
    }
  }
}
