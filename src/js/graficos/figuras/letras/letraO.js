import Circulo from "../Circulo.js";
import LetraInterface from "./letraInterface.js";

export default class LetraO extends LetraInterface {
  constructor(
    id,
    posicion = { x: 0, y: 0, z: 0 },
    opciones = { tamaño: 1, mayuscula: true, color: [1, 1, 1] }
  ) {
    super(id, posicion, opciones);
    this.#init();
  }

  #init() {
    const h = this.posicion.x; // centro X
    const k = this.posicion.y; // centro Y
    let size = this.opciones.tamaño; // escala relativa al tamaño de la casilla
    const color = this.opciones.color;

    if (this.opciones.mayuscula) size *= 1.5;

    const circulo = new Circulo(`${this.id}_circulo`, h, k, size, 50, color);
    this.partes.push(circulo);
  }
}
