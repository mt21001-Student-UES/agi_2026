import ModeloWebGL from "../control/modeloWebGL.js";

/**
 * Clase ModeloReloj
 * -----------------
 * Extiende la clase base ModeloWebGL para dibujar un reloj analógico en un canvas WebGL.
 * Se encarga de generar las coordenadas de las figuras estáticas (círculos y marcas)
 * y de las dinámicas (agujas de horas, minutos y segundos), actualizándolas en cada frame.
 */
class ModeloReloj extends ModeloWebGL {
  constructor(canvas) {
    super(canvas);
    this._raf = null;               // Referencia al requestAnimationFrame activo
    this._render = this._render.bind(this); // Asegura el contexto de this en el loop
    this._x = -1;                   // Variable auxiliar (no usada en este fragmento)
    this.start();                   // Inicia el render loop

    // Construcción de coordenadas estáticas (carátula del reloj)
    let coords = [
      // Círculo exterior gris
      ...this.circleVertices(0, 0, 0.8, 360, [0.5, 0.5, 0.5]),
      // Círculo interior con menos segmentos (marcas principales)
      ...this.circleVertices(0, 0, 0.75, 24),
    ];

    // Círculos concéntricos adicionales para dar textura/estilo
    for (let i = 0; i < 10; i++) {
      coords.push(...this.circleVertices(0, 0, 0.75 - i * 0.01, 12));
    }

    this._staticCoords = coords; // Se almacenan para reutilizar en cada frame
  }

  /**
   * Genera vértices de un círculo en coordenadas 2D.
   * @param {number} xc - Coordenada X del centro
   * @param {number} yc - Coordenada Y del centro
   * @param {number} r - Radio del círculo
   * @param {number} segments - Número de segmentos (resolución)
   * @param {Array} color - Color [r,g,b] de cada vértice
   * @returns {Array} Array plano con coordenadas y color
   */
  circleVertices(xc = 0, yc = 0, r = 0.5, segments = 360, color = [1, 1, 1]) {
    const coords = [];
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * 2 * Math.PI;
      const x = xc + r * Math.cos(theta);
      const y = yc + r * Math.sin(theta);
      coords.push(x, y, 0, ...color); // z=0
    }
    return coords;
  }

  /**
   * Genera los vértices de una aguja (línea radial).
   * @param {number} xc - Coordenada X del centro
   * @param {number} yc - Coordenada Y del centro
   * @param {number} r - Longitud de la aguja
   * @param {number} angleDeg - Ángulo en grados
   * @param {number} segments - Resolución de la línea
   * @param {Array} color - Color [r,g,b] de la aguja
   * @returns {Array} Array plano con coordenadas y color
   */
  buildHandLine(xc, yc, r, angleDeg, segments = 50, color = [1, 1, 1]) {
    const theta = (Math.PI / 180) * angleDeg;
    const coords = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = xc + t * r * Math.sin(theta);
      const y = yc + t * r * Math.cos(theta);
      coords.push(x, y, 0, ...color);
    }

    return coords;
  }

  /**
   * Construye las coordenadas de las tres agujas del reloj
   * (segundos, minutos y horas) en función de la hora actual.
   * @returns {Array} Array plano con las coordenadas de todas las agujas
   */
  buildHandsVertices() {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours() % 12;

    // Aguja de segundos (blanca)
    const secondHand = this.buildHandLine(0, 0, 0.6, seconds * 6);

    // Aguja de minutos (amarilla)
    const minuteHand = this.buildHandLine(0, 0, 0.4, minutes * 6, 50, [1, 1, 0]);

    // Aguja de horas (roja) con ajuste por minutos (0.5° por minuto)
    const hourAngle = hours * 30 + minutes * 0.5;
    const hourHand = this.buildHandLine(0, 0, 0.2, hourAngle, 50, [1, 0, 0]);

    return [...secondHand, ...minuteHand, ...hourHand];
  }

  /**
   * Actualiza las coordenadas dinámicas del reloj (agujas).
   */
  actualizar() {
    this._coordenadas = [...this._staticCoords, ...this.buildHandsVertices()];
  }

  /**
   * Loop de renderizado: actualiza y dibuja cada frame.
   */
  _render() {
    this.actualizar();
    this.dibujarFrame(this._coordenadas);
    this._raf = requestAnimationFrame(this._render);
  }

  /**
   * Inicia la animación del reloj.
   */
  start() {
    if (!this._raf) this._raf = requestAnimationFrame(this._render);
  }

  /**
   * Detiene la animación del reloj.
   */
  stop() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
  }
}

// Instancia del reloj en el canvas
const reloj = new ModeloReloj(document.getElementById("canvas"));