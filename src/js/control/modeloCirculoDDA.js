import lineaDDA from "./algoritmos/lineaDDA.js";
import ModeloWebGL from "./modeloWebGL.js";

class ModeloCirculoDDA extends ModeloWebGL {
  /**
   * @param {HTMLCanvasElement} canvas Canvas con las dimensiones iniciales
   * @param {boolean} redimensionable Si se puede cambiar de tamaño
   * @param {Array} fondoColor
   * @param {Array} pointColor
   * @param {number} pointSize
   */
  constructor(canvas, redimensionable, fondoColor, puntoColor, tamañoPunto) {
    super(canvas, redimensionable, fondoColor, puntoColor, tamañoPunto);
    this.lineas = [];
    this.resolucionLinea = 100;
    this.resolucionCirculo = 10;
    this.radio = 0.5;
  }

  circuloDeVertices(
    xc = 0,
    yc = 0,
    r = 0.5,
    segmentos = 360,
    color = [1, 1, 1]
  ) {
    const coordenadas = [];
    for (let i = 0; i < segmentos; i++) {
      const theta = (i / segmentos) * 2 * Math.PI;
      const x = xc + r * Math.cos(theta);
      const y = yc + r * Math.sin(theta);
      coordenadas.push(x, y, 0, ...color); // z=0
    }
    return coordenadas;
  }

  calcularCirculo(resolucionCirculo, radio = 0.5) {
    let lineas = [];
    console.log(radio);
    const paso = (2 * Math.PI) / resolucionCirculo;

    for (let i = 0; i < resolucionCirculo; i++) {
      // punto en el círculo para este arco
      const ang = i * paso;
      const x0 = radio * Math.cos(ang);
      const y0 = radio * Math.sin(ang);

      // pendiente de la tangente (derivada implícita de x^2 + y^2 = R^2)
      const m = -x0 / y0;

      // calcular intersecciones de la recta tangente con el borde del canvas normalizado [-1,1]
      let puntos = [];

      // intersección con x = -1 y x = 1
      for (let x of [-1, 1]) {
        const y = m * (x - x0) + y0;
        if (y >= -1 && y <= 1) puntos.push([x, y]);
      }

      // intersección con y = -1 y y = 1
      for (let y of [-1, 1]) {
        const x = (y - y0) / m + x0;
        if (x >= -1 && x <= 1) puntos.push([x, y]);
      }

      // si hay al menos dos intersecciones válidas, dibujar la línea completa
      if (puntos.length >= 2) {
        const [p1, p2] = puntos;
        lineas.push(
          ...lineaDDA(
            p1[0],
            p1[1],
            p2[0],
            p2[1],
            this._canvas.width,
            this._canvas.height,
            this._tamañoPunto,
            this._puntoColor
          )
        );
      }
    }

    return lineas;
  }

  circuloDDA(resolucionLinea, resolucionCirculo, radio = 0.5) {
    const paso = 2 / resolucionCirculo;
    const coordenadasSecciones = [];
    for (let i = 1; i < resolucionCirculo + 1; i++) {
      coordenadasSecciones.push(-1 + i * paso);
    }
    const coordenadasSeccionesInversa = coordenadasSecciones
      .toReversed()
      .map((punto) => punto * -1);

    console.log("Secciones: ", coordenadasSecciones);
    console.log("Inversa", coordenadasSeccionesInversa);

    const lineas = [];
    // Bloque -y a -x [x, -1, -1, y]
    for (let i = 1; i < resolucionCirculo + 1; i++) {
      lineas.push([
        coordenadasSecciones[i - 1],
        -1,
        -1,
        coordenadasSecciones.toReversed()[i - 1],
      ]);
    }
    // Bloque -x a y [-1, y, x, 1]
    for (let i = 1; i < resolucionCirculo + 1; i++) {
      lineas.push([
        -1,
        coordenadasSecciones[i - 1] - paso,
        coordenadasSecciones.toReversed()[i - 1],
        1,
      ]);
    }
    console.log(lineas);
    // Bloque y a x
    // Bloque x a -y

    // Lineas DDA
    const puntosLineas = [];

    lineas.forEach((linea) => {
      console.log("Linea: ", ...linea);
      puntosLineas.push(
        ...lineaDDA(
          ...linea,
          this._canvas.width,
          this._canvas.height,
          this._tamañoPunto,
          this._puntoColor
        )
      );
    });
    return puntosLineas;
  }

  setResolucion(resolucionLinea, resolucionCirculo, radio) {
    this.resolucionLinea = resolucionLinea;
    this.resolucionCirculo = resolucionCirculo;
    this.radio = radio;

    this.lineas = [
      //...this.circuloDeVertices(),
      /*
      ...this.calcularCirculo(
        this.resolucionLinea,
        this.resolucionCirculo,
        this.radio
      ),*/
      ...this.circuloDDA(
        this.resolucionLinea,
        this.resolucionCirculo,
        this.radio
      ),
    ];
    console.log("Lineas: ", this.lineas);
    this.dibujarFrame(this.lineas);
  }
}
export default ModeloCirculoDDA;
