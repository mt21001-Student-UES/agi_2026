import TransformComponent from "./componentes/TransformComponent.js";
import FisicaComponent    from "./componentes/FisicaComponent.js";
import RenderComponent    from "./componentes/RenderComponent.js";

/**
 * EntidadFactory — Constructor fluente (Builder) para entidades ECS
 * -----------------------------------------------------------------
 * Crea una entidad en la escena y provee métodos encadenables para
 * añadir los componentes comunes (Transform, Fisica, Render).
 *
 * Las factories específicas (CirculoFactory, LineaFactory, etc.)
 * HEREDAN de esta clase y añaden:
 *   - La geometría concreta (GeometriaComponent con su FiguraInterface)
 *   - Métodos propios del dominio (setOctantes, setColor, getLados…)
 *
 * Patrón de uso:
 *   const entidad = new CirculoFactory(escena, { h:0, k:0, r:0.5 })
 *     .conTransform(0.2, -0.1)
 *     .conFisica()
 *     .conRender('puntos', 3)
 *     .construir();
 */
export default class EntidadFactory {
  #escena;
  #entidad;

  /**
   * @param {import('../core/Escena.js').default} escena  Escena activa
   * @param {string} [nombre]  Nombre descriptivo (solo para depuración)
   */
  constructor(escena, nombre = null) {
    this.#escena  = escena;
    this.#entidad = escena.crearEntidad(nombre);
  }

  // ─── Componentes comunes ────────────────────────────────────────────────

  /**
   * Añade un TransformComponent a la entidad.
   * @param {number} x
   * @param {number} y
   * @param {number} [z=0]
   * @param {number} [rotacion=0]  En radianes
   * @param {number} [escala=1]
   * @returns {this}  Para encadenamiento (funciona en subclases también)
   */
  conTransform(x = 0, y = 0, z = 0, rotacion = 0, escala = 1) {
    this.#escena.agregarComponente(
      this.#entidad,
      new TransformComponent(x, y, z, rotacion, escala)
    );
    return this;
  }

  /**
   * Añade un FisicaComponent a la entidad.
   * @param {number} [velocidadX=0]
   * @param {number} [velocidadY=0]
   * @param {number} [peso=0]  0 = sin gravedad
   * @returns {this}
   */
  conFisica(velocidadX = 0, velocidadY = 0, peso = 0) {
    this.#escena.agregarComponente(
      this.#entidad,
      new FisicaComponent(velocidadX, velocidadY, peso)
    );
    return this;
  }

  /**
   * Añade un RenderComponent a la entidad.
   * @param {string} [modo='puntos']  'puntos' | 'lineas_gl' | 'triangulos' | 'textura'
   * @param {number} [tamañoPunto=5]
   * @param {number} [orden=0]  Mayor orden = se dibuja encima
   * @returns {this}
   */
  conRender(modo = 'puntos', tamañoPunto = 5, orden = 0) {
    this.#escena.agregarComponente(
      this.#entidad,
      new RenderComponent(modo, tamañoPunto, orden)
    );
    return this;
  }

  // Añadir componente geometria
  conGeometria(figura) {
    this.#escena.agregarComponente(
      this.#entidad,
      new GeometriaComponent(figura)
    );
    return this;
  }

  /**
   * Marca la entidad como controlable por el jugador.
   * SistemaFisicas busca este flag para aplicar el input.
   * @param {boolean} [valor=true]
   * @returns {this}
   */
  esControlable(valor = true) {
    this.#entidad.esControlable = valor;
    return this;
  }

  // ─── Acceso protegido para subclases ────────────────────────────────────

  /**
   * La entidad siendo construida.
   * Las subclases acceden a esto para registrar su GeometriaComponent.
   * @returns {Object}
   */
  get entidad() {
    return this.#entidad;
  }

  /**
   * La escena activa.
   * Las subclases pueden llamar escena.agregarComponente() para su geometría.
   * @returns {import('../core/Escena.js').default}
   */
  get escena() {
    return this.#escena;
  }

  // ─── Construcción final ──────────────────────────────────────────────────

  /**
   * Finaliza la construcción y devuelve la entidad registrada en la escena.
   * @returns {Object}  La entidad con todos sus componentes
   */
  construir() {
    return this.#entidad;
  }
}
