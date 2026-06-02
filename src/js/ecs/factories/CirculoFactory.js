import EntidadFactory    from '../EntidadFactory.js';
import GeometriaComponent from '../componentes/GeometriaComponent.js';
import Circulo            from '../../graficos/figuras/Circulo.js';

/**
 * CirculoFactory
 * --------------
 * Hereda de EntidadFactory y añade la geometría y métodos propios del círculo.
 *
 * Al instanciarse, ya crea internamente un Circulo (de Figuras/) y lo envuelve
 * en un GeometriaComponent. Los métodos encadenables de la base (conTransform,
 * conFisica, conRender…) siguen disponibles sin cambio.
 *
 * Métodos adicionales específicos del círculo:
 *   .conOctantes(mask)   → dibuja solo ciertos octantes (medio círculo, arcos…)
 *   .conColor(r, g, b)   → cambia el color y marca el buffer como sucio
 *
 * @example
 *   // Círculo completo con física
 *   const e = new CirculoFactory(escena, { h:0, k:0, r:0.4, color:[1,0.5,0] })
 *     .conTransform()
 *     .conFisica()
 *     .conRender('puntos', 4)
 *     .construir();
 *
 * @example
 *   // Medio círculo superior (octantes 0–3)
 *   const arco = new CirculoFactory(escena, { h:0, k:0, r:0.3 })
 *     .conOctantes([true, true, true, true, false, false, false, false])
 *     .conTransform()
 *     .conRender()
 *     .construir();
 */
export default class CirculoFactory extends EntidadFactory {
  /** @type {Circulo} */
  #figura;

  /**
   * @param {import('../../core/Escena.js').default} escena
   * @param {Object} opciones
   * @param {number} [opciones.h=0]            Centro X en coordenadas mundo
   * @param {number} [opciones.k=0]            Centro Y
   * @param {number} [opciones.r=0.5]          Radio
   * @param {number} [opciones.definicion=50]  Puntos por octante
   * @param {Array}  [opciones.color=[1,1,1]]  Color RGB normalizado
   */
  constructor(escena, { h = 0, k = 0, r = 0.5, definicion = 50, color = [1, 1, 1] } = {}) {
    super(escena, "Circulo");

    // Crear la figura geométrica (clase existente, sin cambios)
    this.#figura = new Circulo(
      this.entidad.id,
      h,
      k,
      r,
      definicion,
      color,
    );

    // Registrar el GeometriaComponent en la entidad
    this.escena.agregarComponente(
      this.entidad,
      new GeometriaComponent(this.#figura),
    );
  }

  // ─── Métodos propios del círculo ─────────────────────────────────────────

  /**
   * Selecciona qué octantes se dibujan.
   * Útil para arcos, medios círculos, cuartos de círculo, etc.
   * @param {boolean[]} mask Array de 8 booleanos [oct0, oct1, …, oct7]
   * @returns {this}
   *
   * Octantes de referencia (viendo el círculo de frente):
   *   0 = derecha-arriba     1 = arriba-derecha
   *   2 = arriba-izquierda   3 = izquierda-arriba
   *   4 = izquierda-abajo    5 = abajo-izquierda
   *   6 = abajo-derecha      7 = derecha-abajo
   */
  conOctantes(mask) {
    this.#figura.setOctantes(mask);
    this.entidad.geometria?.marcarSucio();
    return this;
  }

  /**
   * Cambia el color del círculo.
   * @param {number} r  Rojo   [0, 1]
   * @param {number} g  Verde  [0, 1]
   * @param {number} b  Azul   [0, 1]
   * @returns {this}
   */
  conColor(r, g, b) {
    this.#figura.setColor(r, g, b);
    this.entidad.geometria?.marcarSucio();
    return this;
  }

  /**
   * Acceso directo a la figura por si necesitas llamar métodos
   * que no están expuestos aquí.
   * @returns {Circulo}
   */
  get figura() {
    return this.#figura;
  }
}
