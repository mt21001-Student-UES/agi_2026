/**
 * TransformComponent
 * ------------------
 * Dato puro: dónde está la entidad en el mundo y cómo está orientada.
 * No tiene lógica. Los sistemas (SistemaFisicas, SistemaRender) la leen y escriben.
 *
 * Puede expandirse con: z, rotacionX/Y/Z, escalaX/Y, pivote, etc.
 */
export default class TransformComponent {
  /**
   * @param {number} x         Posición horizontal (NDC o unidades mundo)
   * @param {number} y         Posición vertical
   * @param {number} z         Profundidad (0 por defecto en 2D)
   * @param {number} rotacion  Rotación en radianes alrededor del eje Z
   * @param {number} escala    Factor de escala uniforme
   */
  constructor(x = 0, y = 0, z = 0, rotacion = 0, escala = 1) {
    this.x        = x;
    this.y        = y;
    this.z        = z;
    this.rotacion = rotacion;
    this.escala   = escala;
  }
}
