/**
 * RenderComponent
 * ---------------
 * Dato: cómo quiere ser dibujada la entidad en WebGL.
 * SistemaRender agrupa las entidades por modo para minimizar cambios de programa shader.
 *
 * Modos disponibles (se pueden añadir más conforme se creen shaders):
 *   'puntos'      → gl.POINTS  con el shader de puntos coloreados (uso principal)
 *   'lineas_gl'   → gl.LINES   nativo de WebGL (sin algoritmo de rasterización)
 *   'triangulos'  → gl.TRIANGLES para figuras rellenas o 3D
 *   'textura'     → shader especial con coordenadas UV (ej: fondo con imagen)
 */
export default class RenderComponent {
  /**
   * @param {string} modo         Shader a usar. Default: 'puntos'
   * @param {number} tamañoPunto  Tamaño en px del punto (solo modo 'puntos')
   * @param {number} orden        Orden de dibujado (0 = fondo, mayor = encima)
   */
  constructor(modo = 'puntos', tamañoPunto = 5, orden = 0) {
    this.modo        = modo;
    this.tamañoPunto = tamañoPunto;
    this.orden       = orden;
    this.visible     = true;  // false = SistemaRender lo omite sin destruirlo
  }
}
