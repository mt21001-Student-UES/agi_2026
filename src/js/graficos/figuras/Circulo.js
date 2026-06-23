import FiguraInterface from "./figuraInterface.js";

/**
 * Circulo — Figura rasterizada en espacio de píxeles local.
 *
 * Genera los vértices de un círculo de radio `r` centrado en el origen (0,0).
 * Usa simetría por octantes (Bresenham-style).
 * La posición en el mundo se delega completamente al TransformComponent.
 *
 * Formato del buffer: [x, y, z, r, g, b, ...]
 */
export default class Circulo extends FiguraInterface {
  #r;
  #definicion;
  #color;
  #octantes;

  /**
   * @param {string}   id
   * @param {number}   r          Radio en píxeles locales
   * @param {number}   [definicion=50]  Nº de puntos por octante
   * @param {number[]} [color]    [r, g, b] en [0,1]
   */
  constructor(id, r, definicion = 50, color = [1, 1, 1]) {
    super(id);
    this.#r          = r;
    this.#definicion = definicion;
    this.#color      = color;
    this.#octantes   = [true, true, true, true, true, true, true, true];
  }

  // ── Setters ────────────────────────────────────────────────────────────────

  setRadio(r)              { this.#r = r; this.marcarSucio(); }
  setDefinicion(d)         { this.#definicion = d; this.marcarSucio(); }
  setColor(r, g, b)        { this.#color = [r, g, b]; this.marcarSucio(); }

  /**
   * Selecciona qué octantes dibujar (máscara de 8 booleanos).
   * @param {boolean[]} mask
   */
  setOctantes(mask) {
    if (Array.isArray(mask) && mask.length === 8) {
      this.#octantes = mask;
      this.marcarSucio();
    } else {
      console.warn("[Circulo] setOctantes: la máscara debe tener 8 elementos.");
    }
  }

  // ── Rasterización ──────────────────────────────────────────────────────────

  #generarOctanteBase() {
    const puntos = [];
    const r2   = this.#r * this.#r;
    const xMin = this.#r / Math.sqrt(2);
    const paso = this.#definicion > 1 ? (this.#r - xMin) / (this.#definicion - 1) : 0;

    for (let x = this.#r; x >= xMin; x -= paso) {
      const y = Math.sqrt(r2 - x * x);
      puntos.push([x, y]);
    }
    return puntos;
  }

  #aplicarSimetria(x, y, octante) {
    switch (octante) {
      case 0: return [ x,  y];
      case 1: return [ y,  x];
      case 2: return [-y,  x];
      case 3: return [-x,  y];
      case 4: return [-x, -y];
      case 5: return [-y, -x];
      case 6: return [ y, -x];
      case 7: return [ x, -y];
    }
  }

  render() {
    const base   = this.#generarOctanteBase();
    const buffer = [];
    const [cr, cg, cb] = this.#color;

    for (let oct = 0; oct < 8; oct++) {
      if (!this.#octantes[oct]) continue;
      for (const [px, py] of base) {
        const [tx, ty] = this.#aplicarSimetria(px, py, oct);
        buffer.push(tx, ty, 0, cr, cg, cb);  // z=0 (local)
      }
    }

    this.setBuffer(new Float32Array(buffer));
  }

  /** Marca el buffer como sucio para forzar rerasterización */
  marcarSucio() {
    this._sucio = true;
  }
}

