/**
 * CasillaComponent
 * ----------------
 * Datos puros de una casilla del tablero.
 * El campo `nivel` permite tableros 3D (Parcial 3); en 2D es siempre 0.
 */
export default class CasillaComponent {
  /**
   * @param {number} fila
   * @param {number} columna
   * @param {number} [nivel=0]  Nivel del tablero (0=base, 1=medio, 2=fondo en 3D)
   */
  constructor(fila = 0, columna = 0, nivel = 0) {
    this.fila    = fila;
    this.columna = columna;
    this.nivel   = nivel;
    this.estado  = 'vacia';  // 'vacia' | 'equis' | 'cero'
    this.hover   = false;
  }
}

