import EntidadFactory from '../EntidadFactory.js';
import GeometriaComponent from '../componentes/GeometriaComponent.js';
import RenderComponent from '../componentes/RenderComponent.js';
import TransformComponent from '../componentes/TransformComponent.js';
import CasillaComponent from '../componentes/CasillaComponent.js';
import GridDDA from '../../graficos/figuras/GridDDA.js';

/**
 * GridFactory
 * -----------
 * Genera el tablero visual (GridDDA) y las entidades lógicas (casillas).
 *
 * El grid se genera en espacio de píxeles locales centrado en (0,0).
 * El TransformComponent lo posiciona en escena (por defecto en el centro del canvas).
 */
export default class GridFactory extends EntidadFactory {
  /**
   * @param {import('../../core/Escena.js').default} escena
   * @param {Object}   opciones
   * @param {number}   opciones.filas
   * @param {number}   opciones.columnas
   * @param {number}   opciones.anchoPx   Ancho total del tablero en píxeles canvas
   * @param {number}   opciones.altoPx    Alto total del tablero en píxeles canvas
   * @param {number[]} [opciones.color]   [r, g, b]
   * @param {number}   [opciones.nivel=0] Nivel del tablero (para 3D)
   */
  constructor(escena, {
    filas    = 10,
    columnas = 10,
    anchoPx  = 500,
    altoPx   = 500,
    color    = [1, 1, 1],
    nivel    = 0,
  } = {}) {
    super(escena, 'TableroAmoeba');

    // 1. Figura visual en píxeles locales (algoritmo DDA)
    const figuraGrid = new GridDDA(this.entidad.id, filas, columnas, anchoPx, altoPx, color);
    this.escena.agregarComponente(this.entidad, new GeometriaComponent(figuraGrid));

    // Guardar referencia al GridDDA para que el boundary pueda obtener tamanoCelda
    this.entidad.gridDDA = figuraGrid;

    // 2. Casillas lógicas (una por celda del tablero)
    this.casillas = [];
    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < columnas; c++) {
        const casillaId = escena.crearEntidad(`Casilla_${nivel}_${f}_${c}`);
        escena.agregarComponente(casillaId, new CasillaComponent(f, c, nivel));
        this.casillas.push(casillaId);
      }
    }
  }

  obtenerCasillas() {
    return this.casillas;
  }
}

