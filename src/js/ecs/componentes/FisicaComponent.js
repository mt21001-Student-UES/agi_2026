/**
 * FisicaComponent
 * ---------------
 * Dato puro: cómo se mueve la entidad en el mundo.
 * SistemaFisicas lo lee para aplicar velocidad al TransformComponent.
 *
 * Expansión prevista (añadir campos conforme se necesiten):
 *   peso          → cuánto le afecta la gravedad (ej: 1.0 normal, 0 = flota)
 *   gravedad      → aceleración por frame en Y
 *   friccion      → deceleración al no haber input (0–1)
 *   enSuelo       → flag para salto
 *   fuerzaSalto   → impulso vertical al saltar
 */
export default class FisicaComponent {
  /**
   * @param {number} velocidadX  Velocidad horizontal inicial (unidades/segundo)
   * @param {number} velocidadY  Velocidad vertical inicial
   * @param {number} peso        Multiplicador de gravedad (0 = sin gravedad)
   */
  constructor(velocidadX = 0, velocidadY = 0, peso = 0) {
    this.velocidadX = velocidadX;
    this.velocidadY = velocidadY;
    this.peso       = peso;   // 0 = estático, 1 = gravedad normal
    // Campos opcionales para expansión futura:
    // this.enSuelo    = true;
    // this.friccion   = 0.9;
    // this.fuerzaSalto = 8;
  }
}
