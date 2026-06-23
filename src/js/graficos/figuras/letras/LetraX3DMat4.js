import FiguraInterface from "../figuraInterface.js";
import lineaDDA from "../../algoritmos/lineaDDA.js";
import floodFill from "../../algoritmos/rellenoPorInundacion.js";

/**
 * LetraX3DMat4
 * ============
 * Figura alternativa de Equis 3D que usa coordenadas Z reales para la extrusión.
 *
 * Diferencia clave con LetraX3D (Mat3):
 *   - LetraX3D   → finge profundidad desplazando [vx-i, vy-i, 0] (hack isométrico)
 *   - LetraX3DMat4 → usa Z real [vx, vy, z] y delega la rotación 3D al shader Mat4
 *
 * Se debe usar junto con:
 *   - TransformComponent con modo3D: true
 *   - RenderComponent con modo: 'puntos3d'
 *   - SistemaRender que pase la Mat4 como uniform al shader 3D
 *
 * La rasterización (DDA + Flood Fill) es idéntica a LetraX3D.
 * Solo cambia el paso de extrusión: Z real en vez de offset XY.
 */
export default class LetraX3DMat4 extends FiguraInterface {
  static bufferCache = null;

  /**
   * @param {*} id
   * @param {Object} opciones
   * @param {number} [opciones.tamaño=20]
   * @param {number} [opciones.grosor=6]
   * @param {number} [opciones.altura3D=10]
   * @param {number[]} [opciones.colorCaraSup=[1,0.4,0.4]]
   * @param {number[]} [opciones.colorCaraInf=[0.5,0,0]]
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
    this.rellenarCaras = opts.rellenarCaras !== false; // Default true

    if (LetraX3DMat4.bufferCache && this.rellenarCaras) {
      // Nota: el caché por ahora asume rellenarCaras=true para simplificar. 
      // Si se ocupa dinámico, se debería cambiar el cache o ignorarlo.
      this.setBuffer(LetraX3DMat4.bufferCache);
    }
  }

  render() {
    if (LetraX3DMat4.bufferCache && this.rellenarCaras) return;

    const s = this.tamaño;
    const g = this.grosor;

    // Matriz local: espacio para rasterizar la X
    const w = Math.ceil(s * 2.5);
    const h = Math.ceil(s * 2.5);
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);

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

    // 2. Dibujar aristas con DDA
    for (let i = 0; i < vertices.length; i++) {
      const p1 = vertices[i];
      const p2 = vertices[(i + 1) % vertices.length];
      const puntosLinea = lineaDDA(p1[0], p1[1], p2[0], p2[1], 1);

      for (let j = 0; j < puntosLinea.length; j += 2) {
        const x = Math.round(puntosLinea[j]);
        const y = Math.round(puntosLinea[j + 1]);
        if (x >= 0 && x < w && y >= 0 && y < h) {
          matriz[y * w + x] = 1;
        }
      }
    }

    // 3. Rellenar el interior (Flood Fill)
    //    Usamos el algoritmo de inundación estándar importado, comenzando desde 
    //    el centro de la matriz local para colorear todo el interior de la X.
    if (this.rellenarCaras) {
      floodFill(matriz, cx, cy, w, h, 1, 2);
    }

    // Extraer puntos centrados en (0,0)
    const verticesBase = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (matriz[y * w + x] > 0) {
          verticesBase.push([x - cx, y - cy]);
        }
      }
    }

    // 4. Extrusión 3D con Z REAL (Z-Stacking Falso convertido a Z puro)
    //    Para generar el volumen tridimensional, iteramos `altura3D` veces (Z real).
    //    Cada capa 2D de la X (creada arriba) es duplicada asignándole su propia 
    //    coordenada Z (hacia la cámara, valores negativos).
    //    El shader de Mat4 en el GPU se encarga luego de rotar y aplicar la perspectiva.
    //    También interpolamos el color (f) entre CaraInferior y CaraSuperior para el sombreado.
    const bufferFinal = [];
    const pasosExtrusion = this.altura3D;

    for (let i = 0; i <= pasosExtrusion; i++) {
      const f = i / pasosExtrusion;
      const c = [
        this.colorCaraInf[0] + (this.colorCaraSup[0] - this.colorCaraInf[0]) * f,
        this.colorCaraInf[1] + (this.colorCaraSup[1] - this.colorCaraInf[1]) * f,
        this.colorCaraInf[2] + (this.colorCaraSup[2] - this.colorCaraInf[2]) * f,
      ];

      for (const [vx, vy] of verticesBase) {
        // Z real para la extrusión usando Mat4 (hacia la cámara, -Z)
        bufferFinal.push(vx, vy, -i, ...c);
      }
    }

    if (this.rellenarCaras) {
      LetraX3DMat4.bufferCache = new Float32Array(bufferFinal);
    }
    this.setBuffer(bufferFinal);
  }
}
