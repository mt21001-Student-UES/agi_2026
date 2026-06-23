import FiguraInterface from "./figuraInterface.js";
import lineaBresenham from "../algoritmos/lineaBresenham.js";
import lineaDDA from "../algoritmos/lineaDDA.js";
import rellenoPorFrontera from "../algoritmos/rellenoPorFrontera.js";
import floodFill from "../algoritmos/rellenoPorInundacion.js";

export default class Cuadrado extends FiguraInterface {
  #canvas;
  #x0;
  #y0;
  #x1;
  #y1;
  #color;
  #relleno;
  #ctx2D;
  #colorFrontera;

  constructor(
    id,
    x0,
    y0,
    x1,
    y1,
    canvas,
    color = [1, 1, 1],
    algoritmo,
    relleno = false,
    algoritmoRelleno = null,
    colorFrontera = [0, 0, 0],
  ) {
    super(id);
    this.#x0 = x0;
    this.#y0 = y0;
    this.#x1 = x1;
    this.#y1 = y1;
    this.algoritmo = algoritmo;
    this.#canvas = canvas;
    this.#color = color;
    this.#relleno = relleno;
    this.algoritmoRelleno = algoritmoRelleno;
    this.#colorFrontera = colorFrontera;
  }

  // Devuelve los lados como pares de vértices
  getLados() {
    return [
      [
        [this.#x0, this.#y0],
        [this.#x1, this.#y0],
      ], // lado superior
      [
        [this.#x1, this.#y0],
        [this.#x1, this.#y1],
      ], // lado derecho
      [
        [this.#x1, this.#y1],
        [this.#x0, this.#y1],
      ], // lado inferior
      [
        [this.#x0, this.#y1],
        [this.#x0, this.#y0],
      ], // lado izquierdo
    ];
  }

  contiene(px, py) {
    // Normaliza los límites
    const minX = Math.min(this.#x0, this.#x1);
    const maxX = Math.max(this.#x0, this.#x1);
    const minY = Math.min(this.#y0, this.#y1);
    const maxY = Math.max(this.#y0, this.#y1);

    // Verifica si el punto está dentro
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  }

  render() {
    const puntosCuadrado = [];

    // 1. Crear matriz interna
    const ancho = Math.max(1, Math.round(Math.abs(this.#x1 - this.#x0)));
    const alto = Math.max(1, Math.round(Math.abs(this.#y1 - this.#y0)));
    const matriz = new Uint8Array(ancho * alto);

    // 2. Dibujar aristas en la matriz
    const lados = this.getLados();

    //console.log(this.getLados());
    lados.forEach(([p0, p1]) => {
      const puntosLados = [];
      if (this.algoritmo === "lineaDDA") {
        //console.log("Usando DDA para: ", p0, p1);
        puntosLados.push(...lineaDDA(p0[0], p0[1], p1[0], p1[1], 1));
      } else {
        //console.log("Usando Bresenham para: ", p0, p1);
        puntosLados.push(...lineaBresenham(p0[0], p0[1], p1[0], p1[1]));
      }
      for (let i = 0; i < puntosLados.length; i += 2) {
        const x = puntosLados[i];
        const y = puntosLados[i + 1];
        puntosCuadrado.push(...[x, y, 0, ...this.#color]);
      }
    });

    // 3. Flood fill si se pide relleno
    if (this.#relleno) {
      const cx = Math.floor(ancho / 2);
      const cy = Math.floor(alto / 2);
      floodFill(matriz, cx, cy, ancho, alto, 1, 2);

      // 4. Extraer puntos rellenados
      for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
          if (matriz[y * ancho + x] === 2) {
            puntosCuadrado.push(
              this.#x0 + x,
              this.#y0 + y,
              0,
              ...this.#color,
            );
          }
        }
      }
      //console.warn("releno hecho");
    }

    //console.log("Puntos del cuadrado: ", puntosLados);
    this.setBuffer(puntosCuadrado);
  }

  setColor(r, g, b) {
    this.#color = [r, g, b];
  }

  get ancho() {
    return this.#canvas.width;
  }
  get alto() {
    return this.#canvas.height;
  }

  get x0() {
    return this.#x0;
  }
  get y0() {
    return this.#y0;
  }
  get x1() {
    return this.#x1;
  }
  get y1() {
    return this.#y1;
  }

  get centro() {
    return [
      this.#x0 + (this.#x1 - this.#x0) / 2,
      this.#y0 + (this.#y1 - this.#y0) / 2,
    ];
  }

  toPixel(nx, ny, width, height) {
    if (Math.abs(nx) > 1.1 || Math.abs(ny) > 1.1) {
      // Si el valor es mayor a 1, asumimos que ya está en píxeles locales
      // centrados en el origen, por lo que lo trasladamos al sistema 2D (0,0 arriba a la izquierda).
      return [nx + width / 2, ny + height / 2];
    }
    const px = ((nx + 1) / 2) * width;
    const py = ((1 - ny) / 2) * height; // inversión de Y
    return [px, py];
  }

  draw2D(ctx2D) {
    // Esto dibuja el cuadrado al revez
    const [px0, py0] = this.toPixel(
      this.#x0,
      this.#y0,
      ctx2D.canvas.width,
      ctx2D.canvas.height,
    );
    const [px1, py1] = this.toPixel(
      this.#x1,
      this.#y1,
      ctx2D.canvas.width,
      ctx2D.canvas.height,
    );

    const x = Math.min(px0, px1);
    const y = Math.min(py0, py1);
    const w = Math.abs(px1 - px0);
    const h = Math.abs(py1 - py0);

    // Solo dibuja la frontera
    ctx2D.strokeStyle = `rgb(${this.#colorFrontera[0] * 255}, ${this.#colorFrontera[1] * 255}, ${this.#colorFrontera[2] * 255})`;
    ctx2D.strokeRect(x, y, w, h);

    // Semilla en el centro
    const cx = Math.floor(x + w / 2);
    const cy = Math.floor(y + h / 2);

    const puntosRelleno = rellenoPorFrontera(
      ctx2D,
      cx,
      cy,
      [this.#color[0] * 255, this.#color[1] * 255, this.#color[2] * 255, 255],
      [
        this.#colorFrontera[0] * 255,
        this.#colorFrontera[1] * 255,
        this.#colorFrontera[2] * 255,
        255,
      ],
      false,
    );

    this.puntosRelleno = [];
    for (let i = 0; i < puntosRelleno.length; i += 2) {
      // Transformar de vuelta a coordenadas locales centradas (ya que el buffer se multiplica luego por el TransformMatrix)
      const lx = puntosRelleno[i] - ctx2D.canvas.width / 2;
      const ly = puntosRelleno[i + 1] - ctx2D.canvas.height / 2;
      this.puntosRelleno.push(lx, ly);
    }
  }
}
