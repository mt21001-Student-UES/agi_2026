/**
 * AnimacionEfectoComponent
 * ------------------------
 * Datos del ciclo de vida de una animación de aparición (pop-in).
 *
 * SistemaAnimacion lo lee cada frame y modifica TransformComponent.escala
 * interpolando progreso de 0→1 durante `duracion` segundos.
 *
 * Fases:
 *   ENTRADA  : escala crece de escalaInicial → escalaFinal  (aparece)
 *   REBOTE   : escala oscila levemente (efecto elástico intermitente)
 *   COMPLETADA: la entidad queda estática con escala = escalaFinal
 */
export default class AnimacionEfectoComponent {
  /**
   * @param {number} duracion        Duración total en segundos (default 0.35s)
   * @param {number} escalaInicial   Escala al iniciar (0 = invisible)
   * @param {number} escalaFinalX    Escala X objetivo (1 = tamaño completo)
   * @param {number} escalaFinalY    Escala Y objetivo (por defecto igual a X)
   */
  constructor(duracion = 0.35, escalaInicial = 0, escalaFinalX = 1, escalaFinalY = null) {
    this.duracion      = duracion;
    this.escalaInicial = escalaInicial;
    this.escalaFinalX  = escalaFinalX;
    this.escalaFinalY  = escalaFinalY ?? escalaFinalX;

    this.progreso  = 0;   // 0.0 → 1.0
    this.activa    = true; // false = animación terminada, sin coste
    this.fase      = 'entrada'; // 'entrada' | 'rebote' | 'completada'

    // Rebote intermitente (±bounce * sin(...)  frames después de la entrada)
    this.reboteDuracion = 0.25; // segundos de oscilación
    this.reboteTimer    = 0;
    this.reboteAmplitud = 0.10; // ± del escalaFinal
  }
}