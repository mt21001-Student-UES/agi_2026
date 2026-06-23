import FiguraInterface from "../figuraInterface.js";
import lineaDDA from "../../algoritmos/lineaDDA.js";

/**
 * LetraX3D
 * Genera una Equis con volumen 3D utilizando un rasterizado en matriz en memoria (Uint8Array).
 * Genera bordes con DDA y rellena con flood fill clásico.
 * El buffer resultante es cacheado para no recalcularlo en cada instancia.
 */
export default class LetraX3D extends FiguraInterface {
  // Caché estático global para esta figura
  static bufferCache = null;

  /**
   * Crea una X 3D con las opciones pasadas por parámetro.
   * @param {*} id
   * @param {Object} opciones
   * @param {number} opciones.tamaño
   * @param {number[]} opciones.color
   * @param {boolean} opciones.volumen3D
   * @param {number} opciones.grosor
   * @param {number} opciones.altura3D
   * @param {number[]} opciones.colorCaraSup
   * @param {number[]} opciones.colorCaraInf
   */
  constructor(id, opciones = {}) {
    const defaults = {
      tamaño: 20,
      grosor: 6,
      altura3D: 10,
      colorCaraSup: [1, 0.4, 0.4],
      colorCaraInf: [0.5, 0, 0],
    };

    const opts = { ...defaults, ...opciones };

    super(id);
    this.tamaño = opts.tamaño;
    this.grosor = opts.grosor;
    this.altura3D = opts.altura3D;
    this.colorCaraSup = opts.colorCaraSup;
    this.colorCaraInf = opts.colorCaraInf;

    if (LetraX3D.bufferCache) {
      this.setBuffer(LetraX3D.bufferCache);
    }
  }

  render() {
    // Si ya existe el caché, no hacemos nada extra, el buffer ya está seteado.
    if (LetraX3D.bufferCache) return;

    const s = this.tamaño;
    const g = this.grosor;

    // Matriz local: un espacio lo suficientemente grande
    const w = Math.ceil(s * 2.5); // ancho de la X
    const h = Math.ceil(s * 2.5); // alto de la X
    const cx = Math.floor(w / 2); // centro x
    const cy = Math.floor(h / 2); // centro y

    const matriz = new Uint8Array(w * h); // 0: Vacío, 1: Borde, 2: Relleno

    // 1. Vértices del polígono en forma de X cruzada
    const vertices = [
      [cx - g, cy],
      [cx - s, cy - s + g],
      [cx - s + g, cy - s],
      [cx, cy - g],
      [cx + s - g, cy - s],
      [cx + s, cy - s + g],
      [cx + g, cy],
      [cx + s, cy + s - g],
      [cx + s - g, cy + s],
      [cx, cy + g],
      [cx - s + g, cy + s],
      [cx - s, cy + s - g],
    ];

    // 2. Dibujar Aristas con algoritmo DDA en la matriz
    for (let i = 0; i < vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % vertices.length];
      const puntosLinea = lineaDDA(p1[0], p1[1], p2[0], p2[1], 1);

      for (let j = 0; j < puntosLinea.length; j += 2) {
        const x = Math.round(puntosLinea[j]);
        const y = Math.round(puntosLinea[j + 1]);
        if (x >= 0 && x < w && y >= 0 && y < h) {
          matriz[y * w + x] = 1; // Marcar borde
        }
      }
    }

    // 3. Rellenar caras (Flood Fill basado en matriz)
    // El centro de la X (cx, cy) garantiza estar dentro de la figura
    const stack = [[cx, cy]];
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      if (x < 0 || x >= w || y < 0 || y >= h) continue;

      const idx = y * w + x;
      if (matriz[idx] !== 0) continue; // Si es borde (1) o ya visitado/rellenado (2), saltar

      matriz[idx] = 2; // Marcar como rellenado

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    // Extraer puntos con offset para centrarlos en 0,0
    const verticesBase = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (matriz[y * w + x] > 0) {
          verticesBase.push([x - cx, y - cy]);
        }
      }
    }

    // 4. Extrusión 3D Z-Stacking
    const bufferFinal = [];
    const pasosExtrusion = this.altura3D;

    for (let i = 0; i <= pasosExtrusion; i++) {
      const f = i / pasosExtrusion;
      const c = [
        this.colorCaraInf[0] +
          (this.colorCaraSup[0] - this.colorCaraInf[0]) * f,
        this.colorCaraInf[1] +
          (this.colorCaraSup[1] - this.colorCaraInf[1]) * f,
        this.colorCaraInf[2] +
          (this.colorCaraSup[2] - this.colorCaraInf[2]) * f,
      ];

      for (const [vx, vy] of verticesBase) {
        // Al aplicar la Mat3 (rotZ=45, rotX=60), un desplazamiento local de [-i, -i]
        // se proyecta en la pantalla como un desplazamiento vertical estricto (eje Z isométrico)
        bufferFinal.push(vx - i, vy - i, 0, ...c);
      }
    }

    // Guardar en caché estático
    LetraX3D.bufferCache = new Float32Array(bufferFinal);
    this.setBuffer(LetraX3D.bufferCache);
  }
}
