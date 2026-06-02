import FiguraInterface from "./figuraInterface.js";

export default class Circulo extends FiguraInterface {
  #h;
  #k;
  #r;
  #definicion;
  #color;
  #octantes;

  constructor(id, h, k, r, definicion = 50, color = [1, 1, 1]) {
    super(id);
    this.#h = h;
    this.#k = k;
    this.#r = r;
    this.#definicion = definicion;
    this.#color = color;
    this.#octantes = [true, true, true, true, true, true, true, true];
    console.warn("Circulo solo funciona con algoritmo bresenham, implementar cambio de algoritmo en CirculoFactory")
  }

  /** Métodos para modificar los parametros de la figura */
  setRadio(r) {
    this.#r = r;
    this.render();
  }

  setDefinicion(definicion) {
    this.#definicion = definicion;
    this.render();
  }

  setCentro(h, k) {
    this.#h = h;
    this.#k = k;
    this.render();
  }

  /**
   * @param {Array<boolean>} mask Octantes a dibujar
   */
  setOctantes(mask) {
    if (Array.isArray(mask) && mask.length === 8) {
      this.#octantes = mask;
    } else {
      console.warn("Octantes inválidos");
    }
  }

  setColor(r, g, b) {
    this.#color = [r, g, b];
  }

  // Octante base
  #generarOctanteBase() {
    const puntos = [];
    const r2 = this.#r * this.#r;
    const xMin = this.#r / Math.sqrt(2);
    const paso = (this.#r - xMin) / this.#definicion;

    for (let x = this.#r; x >= xMin; x -= paso) {
      const y = Math.sqrt(r2 - x * x);
      puntos.push([x, y]);
    }
    return puntos;
  }

  #aplicarSimetria(x, y, octante) {
    switch (octante) {
      case 0:
        return [x, y];
      case 1:
        return [y, x];
      case 2:
        return [-y, x];
      case 3:
        return [-x, y];
      case 4:
        return [-x, -y];
      case 5:
        return [-y, -x];
      case 6:
        return [y, -x];
      case 7:
        return [x, -y];
    }
  }

  generarVertices() {
    const base = this.#generarOctanteBase();
    const array = [];
    for (let i = 0; i < 8; i++) {
      if (!this.#octantes[i]) continue;
      for (const [x, y] of base) {
        const [tx, ty] = this.#aplicarSimetria(x, y, i);
        array.push(
          this.#h + tx,
          this.#k + ty,
          0,
          this.#color[0],
          this.#color[1],
          this.#color[2]
        );
      }
    }
    return new Float32Array(array);
  }

  render() {
    this.setBuffer(this.generarVertices());
  }
}
