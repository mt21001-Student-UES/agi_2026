import EntidadFactory from '../EntidadFactory.js';
import GeometriaComponent from '../componentes/GeometriaComponent.js';
import CasillaComponent from '../componentes/CasillaComponent.js';

import GridDDA from '../../graficos/figuras/GridDDA.js';

/**
 * GridFactory
 * -----------
 * Genera el tablero y las entidades lógicas (casillas).
 */
export default class GridFactory extends EntidadFactory {
  constructor(escena, { filas = 10, columnas = 10, color = [1, 1, 1] } = {}) {
    super(escena, 'TableroAmoeba');

    // 1. Instanciar la figura visual usando DDA (requerimiento del parcial)
    const figuraGrid = new GridDDA(this.entidad.id, filas, columnas, color);
    this.escena.agregarComponente(this.entidad, new GeometriaComponent(figuraGrid));

    // 2. Generar las casillas lógicas (entidades invisibles para manejar interacción)
    this.casillas = [];
    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < columnas; c++) {
        const casillaId = escena.crearEntidad(`Casilla_${f}_${c}`);
        escena.agregarComponente(casillaId, new CasillaComponent(f, c));
        this.casillas.push(casillaId);
      }
    }
  }

  // Métodos de utilidad para acceder a casillas
  obtenerCasillas() {
    return this.casillas;
  }
}
