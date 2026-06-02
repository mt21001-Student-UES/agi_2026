import FiguraInterface from "../figuraInterface.js";

export default class LetraInterface extends FiguraInterface {
  constructor(
    id,
    posicion = { x: 0, y: 0 },
    opciones = { tamaño: 1, mayuscula: true, color: [1, 1, 1] },
  ) {
    super(id, posicion);
    this.opciones = opciones;
    this.partes = [];
  }

  render() {
    this.buffer = [];
    //console.log(this.partes);
    for (const parte of this.partes) {
      parte.render();
      this.buffer.push(...parte.getBuffer());
    }
  }

  getBuffer() {
    return this.buffer;
  }
}
