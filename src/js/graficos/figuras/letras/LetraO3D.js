import FiguraInterface from "../figuraInterface.js";

/**
 * LetraO3D
 * Genera una O con volumen 3D utilizando un rasterizado en matriz en memoria (Uint8Array).
 * Genera aristas con un algoritmo trigonométrico denso para evitar huecos 
 * y rellena las caras con flood fill.
 * El buffer final se guarda en caché.
 */
export default class LetraO3D extends FiguraInterface {
  static bufferCache = null;

  constructor(id, opciones = {}) {
    super(id);
    this.tamaño = opciones.tamaño || 20;
    this.colorCaraSup = opciones.color || [0.4, 0.6, 1];
    this.colorCaraInf = opciones.colorCaraInf || [0, 0, 0.5]; // Sombra
    this.grosor = opciones.grosor || 6;
    this.altura3D = opciones.altura3D || 10;

    if (LetraO3D.bufferCache) {
      this.setBuffer(LetraO3D.bufferCache);
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
    if (LetraO3D.bufferCache) return;

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
    // Buscamos un punto de inicio seguro: el centro del grosor
    const radioMedio = Math.floor((rExterno + rInterno) / 2);
    const startX = cx + radioMedio;
    const startY = cy;

    const stack = [[startX, startY]];
    while (stack.length > 0) {
      const [px, py] = stack.pop();
      if (px < 0 || px >= w || py < 0 || py >= h) continue;
      
      const idx = py * w + px;
      if (matriz[idx] !== 0) continue; // Borde o ya rellenado
      
      matriz[idx] = 2; // Relleno
      
      stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
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

    // 3. Extrusión 3D
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
        // Desplazamiento local [-i, -i] proyecta exactamente vertical con la Mat3(45,60)
        bufferFinal.push(vx - i, vy - i, 0, ...c);
      }
    }

    const arrayBuffer = new Float32Array(bufferFinal);
    LetraO3D.bufferCache = arrayBuffer;
    this.setBuffer(arrayBuffer);
  }
}
