/**
 * CasillaComponent
 * ----------------
 * Datos puros de una casilla del tablero de Amoeba.
 */
export default class CasillaComponent {
  /**
   * @param {number} fila 
   * @param {number} columna 
   */
  constructor(fila = 0, columna = 0) {
    this.fila = fila;
    this.columna = columna;
    this.estado = 'vacia'; // 'vacia', 'equis', 'cero'
    this.hover = false; // true si el mouse está sobre esta casilla
  }
}
