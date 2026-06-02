import Cuadrado from "../Figuras/Cuadrado.js";
import FiguraInterface from "./figuraInterface.js";

export default class CuadroConTirantes extends FiguraInterface {
  constructor(id, x0, y0, x1, y1, canvas, color = [1, 1, 1]) {
    super(id);
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.canvas = canvas;
    this.cuadro = new Cuadrado(
      id,
      x0,
      y0,
      x1,
      y1,
      canvas,
      color,
      "lineaDDA"
    );
    this.color = color;
    this.mostrarTirantes = false;
    this.tirantes = this.#crearTirantes();
    this.texto = "";
  }

  #crearTirantes() {
    const size = 0.05;
    const tirantes = [
      new Cuadrado(
        `$tirador-${this.id}`,
        this.cuadro.x0 - size,
        this.cuadro.y0 - size,
        this.cuadro.x0 + size,
        this.cuadro.y0 + size,
        this.canvas,
        [1, 1, 1]
      ),
      new Cuadrado(
        `$tirador-${this.id}`,
        this.cuadro.x1 - size,
        this.cuadro.y0 - size,
        this.cuadro.x1 + size,
        this.cuadro.y0 + size,
        this.canvas,
        [1, 1, 1]
      ),
      new Cuadrado(
        `$tirador-${this.id}`,
        this.cuadro.x1 - size,
        this.cuadro.y1 - size,
        this.cuadro.x1 + size,
        this.cuadro.y1 + size,
        this.canvas,
        [1, 1, 1]
      ),
      new Cuadrado(
        `$tirador-${this.id}`,
        this.cuadro.x0 - size,
        this.cuadro.y1 - size,
        this.cuadro.x0 + size,
        this.cuadro.y1 + size,
        this.canvas,
        [1, 1, 1]
      ),
    ];
    tirantes.forEach((t) => t.render());
    return tirantes;
  }

  detectarTirador(x, y) {
    for (let i = 0; i < this.tirantes.length; i++) {
      const t = this.tirantes[i];
      if (t.contiene(x, y)) {
        // método propio de Cuadrado
        return i;
      }
    }
    return -1;
  }

  moverTirador(indice, nuevoX, nuevoY) {
    console.log(`Moviendo tirador ${indice} a (${nuevoX}, ${nuevoY})`);
    switch (indice) {
      case 0:
        this.x0 = nuevoX;
        this.y0 = nuevoY;
        break;
      case 1:
        this.x1 = nuevoX;
        this.y0 = nuevoY;
        break;
      case 2:
        this.x1 = nuevoX;
        this.y1 = nuevoY;
        break;
      case 3:
        this.x0 = nuevoX;
        this.y1 = nuevoY;
        break;
    }

    // Recrear cuadro principal
    //console.log("Valores actuales:", this.x0, this.y0, this.x1, this.y1);
    this.cuadro = new Cuadrado(
      this.id,
      this.x0,
      this.y0,
      this.x1,
      this.y1,
      this.canvas,
      this.color
    );

    // Recrear tiradores
    this.tirantes = this.#crearTirantes(); // regenerar objetos
    this.render();
  }

  redimensionar(indice, nx, ny) {
    this.moverTirador(indice, nx, ny);
  }

  render() {
    const frame = [];

    // Renderizar cuadro principal
    this.cuadro.render();
    frame.push(...this.cuadro.getBuffer());

    // Renderizar tirantes solo si están activos
    if (this.mostrarTirantes) {
      this.tirantes.forEach((t) => {
        t.render();
        frame.push(...t.getBuffer());
        //console.log("Renderizando tirante: ", t,t.id, t.getBuffer());
      });
    }

    this.setBuffer(frame);
  }

  serializar() {
    return {
      id: this.id,
      x0: this.cuadro.x0,
      y0: this.cuadro.y0,
      x1: this.cuadro.x1,
      y1: this.cuadro.y1,
      color: this.color,
      texto: this.texto,
    };
  }

  setColor(r, g, b) {
    this.color = [r, g, b];
    this.cuadro.setColor(r, g, b); // actualizar cuadro principal
    this.render(); // regenerar buffer
  }
}
