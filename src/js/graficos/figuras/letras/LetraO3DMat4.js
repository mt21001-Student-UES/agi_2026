import FiguraInterface from "../figuraInterface.js";
import floodFill from "../../algoritmos/rellenoPorInundacion.js";

/**
 * LetraO3DMat4
 * ============
 * Figura alternativa de Cero 3D que usa coordenadas Z reales para la extrusión.
 *
 * Diferencia clave con LetraO3D (Mat3):
 *   - LetraO3D   → finge profundidad desplazando [vx-i, vy-i, 0] (hack isométrico)
 *   - LetraO3DMat4 → usa Z real [vx, vy, z] y delega la rotación 3D al shader Mat4
 *
 * Se debe usar junto con:
 *   - TransformComponent con modo3D: true
 *   - RenderComponent con modo: 'puntos3d'
 *   - SistemaRender que pase la Mat4 como uniform al shader 3D
 *
 * La rasterización es idéntica a LetraO3D.
 * Solo cambia el paso de extrusión: Z real en vez de offset XY.
 */
export default class LetraO3DMat4 extends FiguraInterface {
  static bufferCache = null;

  constructor(id, opciones = {}) {
    super(id);
    this.tamaño = opciones.tamaño || 20;
    this.colorCaraSup = opciones.color || [0.4, 0.6, 1];
    this.colorCaraInf = opciones.colorCaraInf || [0, 0, 0.5]; // Sombra
    this.grosor = opciones.grosor || 6;
    this.altura3D = opciones.altura3D || 10;
    this.rellenarCaras = opciones.rellenarCaras !== false;

    if (LetraO3DMat4.bufferCache && this.rellenarCaras) {
      this.setBuffer(LetraO3DMat4.bufferCache);
    }
  }

  // Algoritmo circular trigonométrico denso para asegurar un borde cerrado perfecto
  dibujarCirculo(matriz, w, h, cx, cy, r) {
    // Más de 2*PI*R muestras garantiza que no haya saltos de 1 píxel
    const pasos = Math.ceil(2 * Math.PI * r) * 2;
    for (let i = 0; i < pasos; i++) {
      const angulo = (i / pasos) * Math.PI * 2;
      const px = Math.round(cx + Math.cos(angulo) * r);
      const py = Math.round(cy + Math.sin(angulo) * r);
      if (px >= 0 && px < w && py >= 0 && py < h) {
        matriz[py * w + px] = 1; // Borde
      }
    }
  }

  render() {
    if (LetraO3DMat4.bufferCache && this.rellenarCaras) return;

    const rExterno = this.tamaño;
    const rInterno = this.tamaño - this.grosor;
    
    const w = Math.ceil(rExterno * 2.5);
    const h = Math.ceil(rExterno * 2.5);
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);

    const matriz = new Uint8Array(w * h); // 0: Vacío, 1: Borde, 2: Relleno

    // 1. Calcular Aristas (usamos el círculo denso para evitar que el Flood Fill escape)
    this.dibujarCirculo(matriz, w, h, cx, cy, rExterno);
    this.dibujarCirculo(matriz, w, h, cx, cy, rInterno);

    // 2. Rellenar la cara entre los círculos (Flood Fill)
    //    Para la 'O', el relleno no comienza en el centro absoluto (porque es hueca),
    //    sino en un punto seguro justo a la mitad del "grosor" del anillo.
    //    Usamos el algoritmo de inundación estándar importado.
    if (this.rellenarCaras) {
      const radioMedio = Math.floor((rExterno + rInterno) / 2);
      const startX = cx + radioMedio;
      const startY = cy;

      floodFill(matriz, startX, startY, w, h, 1, 2);
    }

    // Extraer vértices y centrarlos
    const verticesBase = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (matriz[y * w + x] > 0) {
          verticesBase.push([x - cx, y - cy]);
        }
      }
    }

    // 3. Extrusión 3D con Z REAL (Volumen Hacia la Cámara)
    //    Al igual que la X, generamos el volumen 3D iterando sobre la altura3D.
    //    A cada vértice base 2D (perteneciente a la dona) lo duplicamos en capas 
    //    progresivas de Z. Interpolamos el color para que la base se vea más oscura
    //    (CaraInferior) y la cima más brillante (CaraSuperior).
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

    const arrayBuffer = new Float32Array(bufferFinal);
    if (this.rellenarCaras) {
      LetraO3DMat4.bufferCache = arrayBuffer;
    }
    this.setBuffer(arrayBuffer);
  }
}
