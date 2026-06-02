/**
 * GeometriaComponent
 * ------------------
 * Dato: la definición visual de la entidad.
 * Envuelve cualquier clase de `Figuras/` (Linea, Circulo, Cuadrado, etc.)
 * para que el SistemaRender pueda obtener su buffer sin importar cómo se calcula.
 *
 * La figura almacena los puntos de control (vértices base, radios, etc.)
 * y sabe generar el buffer con su algoritmo específico.
 * Este componente solo guarda la referencia y un flag de "necesita recalcularse".
 *
 * SistemaRender llama a:
 *   1. figura.render()          → recalcula el buffer interno
 *   2. figura.getBuffer()       → devuelve Float32Array [x,y,z,r,g,b, ...]
 */
export default class GeometriaComponent {
  /**
   * @param {import('../../Figuras/figuraInterface.js').default} figura
   *   Instancia de cualquier subclase de FiguraInterface.
   *   Ejemplos: new Linea(...), new Circulo(...), new CuadroConTirantes(...)
   */
  constructor(figura) {
    this.figura       = figura;
    // Cache del último Float32Array generado por figura.render()
    this._cache       = null;
    // true = el buffer debe recalcularse antes del siguiente frame
    // Se pone en true al crear el componente y cuando la figura cambia.
    this._sucio       = true;
  }

  /**
   * Marca el buffer como desactualizado.
   * Llamar cuando cambie cualquier parámetro de la figura (color, octantes, vértices…).
   */
  marcarSucio() {
    this._sucio = true;
  }

  /**
   * Obtiene el buffer listo para enviar a WebGL.
   * Si el buffer está sucio, llama a figura.render() para recalcularlo.
   * @returns {Float32Array}
   */
  obtenerBuffer() {
    if (this._sucio) {
      this.figura.render();
      this._cache = this.figura.getBuffer();
      this._sucio = false;
    }
    return this._cache;
  }
}
