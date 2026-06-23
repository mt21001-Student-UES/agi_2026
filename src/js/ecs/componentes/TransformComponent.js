import Mat3 from "../../utils/Mat3.js";
import Mat4 from "../../utils/Mat4.js";

/**
 * TransformComponent
 * ------------------
 * Dato puro: posición, rotación y escala de una entidad en el mundo.
 * Mantiene una matriz local-a-mundo calculada con lazy evaluation
 * (dirty flag) para evitar recalcular cada frame si nada cambió.
 *
 * ## Modo dual Mat3 / Mat4
 *
 * Por defecto, genera una Mat3 (compatible con el pipeline 2D existente).
 * Si se activa `modo3D = true`, genera además una Mat4 completa que incluye
 * escala en Z y traslación en Z real (no como simple offset).
 *
 * Esto permite que las figuras 3D alternativas (X y O con volumen) usen
 * transformaciones Mat4 completas sin romper el tablero ni el cursor,
 * que siguen usando Mat3.
 *
 * Retrocompatibilidad: el setter `escala` sigue funcionando para código
 * existente (SistemaAnimacion, SistemaEntradaGrid, etc.) que hace
 * `transform.escala = valor`.
 */
export default class TransformComponent {
  /**
   * @param {Object} opciones
   * @param {Object} [opciones.posicion]  Posición {x, y, z}
   * @param {Object} [opciones.rotacion]  Rotación {x, y, z} en radianes
   * @param {Object} [opciones.escala]    Escala   {x, y, z}
   * @param {boolean} [opciones.modo3D]   Si true, genera también una Mat4
   */
  #posicion;
  #rotacion;
  #escala;
  #matriz;      // Mat3 (siempre disponible — pipeline 2D)
  #matriz4;     // Mat4 (solo si modo3D = true — pipeline 3D)
  #dirty;
  #modo3D;

  constructor(
    opciones = {
      posicion: { x: 0, y: 0, z: 0 },
      rotacion: { x: 0, y: 0, z: 0 },
      escala: { x: 1, y: 1, z: 1 },
      modo3D: false,
    },
  ) {
    this.#posicion = opciones.posicion || { x: 0, y: 0, z: 0 };
    this.#rotacion = opciones.rotacion || { x: 0, y: 0, z: 0 };
    this.#escala = opciones.escala || { x: 1, y: 1, z: 1 };
    this.#modo3D = opciones.modo3D || false;

    // Matriz local-a-mundo (calculada bajo demanda)
    this.#matriz = new Mat3();
    this.#matriz4 = null;
    this.#dirty = true;
  }

  /**
   * Construcción de la matriz compuesta T·R·S
   * Genera siempre una Mat3 (pipeline 2D).
   * Si modo3D está activo, genera también una Mat4 completa.
   */
  actualizarMatriz() {
    //if (!this.#dirty) return;

    // ── Mat3 (siempre — retrocompatible) ──────────────────────────────────
    const T = Mat3.traslacion(this.posicionX, this.posicionY, this.posicionZ);
    const R = Mat3.rotacion3D(this.rotacionX, this.rotacionY, this.rotacionZ);
    // No se puede escalar en z ya que implicaría modificar la matriz de proyección a 4x4
    const S = Mat3.escalado(this.escalaX, this.escalaY, 1);

    this.#matriz = T.multiplicar(R).multiplicar(S);

    // ── Mat4 (solo si modo3D — figuras 3D alternativas) ───────────────────
    if (this.#modo3D) {
      const T4 = Mat4.traslacion(this.posicionX, this.posicionY, this.posicionZ);
      const Rx4 = Mat4.rotacionX(this.rotacionX);
      const Ry4 = Mat4.rotacionY(this.rotacionY);
      const Rz4 = Mat4.rotacionZ(this.rotacionZ);
      const S4 = Mat4.escalado(this.escalaX, this.escalaY, this.escalaZ);

      // T · Rx · Ry · Rz · S
      this.#matriz4 = T4.multiplicar(Rx4).multiplicar(Ry4).multiplicar(Rz4).multiplicar(S4);
    }

    this.#dirty = false;
  }

  // Fuerza recálculo de la matriz en el próximo frame.
  // Útil cuando se modifican x/y/z directamente sin pasar por los setters.
  marcarSucio() {
    this.#dirty = true;
  }

  // ── Modo 3D ─────────────────────────────────────────────────────────────

  /**
   * Activa o desactiva el modo 3D (generación de Mat4).
   * Al cambiar, marca dirty para que la matriz se recalcule.
   * @param {boolean} valor
   */
  set modo3D(valor) {
    if (this.#modo3D !== valor) {
      this.#modo3D = valor;
      this.#dirty = true;
    }
  }

  get modo3D() {
    return this.#modo3D;
  }

  /**
   * Devuelve la Mat4 del modelo (solo disponible si modo3D = true).
   * @returns {Mat4|null}
   */
  get matriz4() {
    return this.#matriz4;
  }

  // Getters de posición, rotación y escala
  get posicion() {
    return this.#posicion;
  }

  get rotacion() {
    return this.#rotacion;
  }

  get escala() {
    return this.#escala;
  }

  get posicionX() {
    return this.#posicion.x;
  }
  get posicionY() {
    return this.#posicion.y;
  }
  get posicionZ() {
    return this.#posicion.z;
  }

  get rotacionX() {
    return this.#rotacion.x;
  }
  get rotacionY() {
    return this.#rotacion.y;
  }
  get rotacionZ() {
    return this.#rotacion.z;
  }

  get escalaX() {
    return this.#escala.x;
  }
  get escalaY() {
    return this.#escala.y;
  }
  get escalaZ() {
    return this.#escala.z;
  }

  // Setters de posición, rotación y escala
  set posicion(posicion) {
    this.#posicion.x = posicion.x;
    this.#posicion.y = posicion.y;
    this.#posicion.z = posicion.z;
    this.#dirty = true;
  }

  set rotacion(rotacion) {
    this.#rotacion.x = rotacion.x;
    this.#rotacion.y = rotacion.y;
    this.#rotacion.z = rotacion.z;
    this.#dirty = true;
  }

  set escala(escala) {
    this.#escala.x = escala.x;
    this.#escala.y = escala.y;
    this.#escala.z = escala.z;
    this.#dirty = true;
  }

  // Setters individuales que marcan dirty automáticamente
  set posX(v) {
    this.#posicion.x = v;
    this.#dirty = true;
  }
  set posY(v) {
    this.#posicion.y = v;
    this.#dirty = true;
  }
  set posZ(v) {
    this.#posicion.z = v;
    this.#dirty = true;
  }

  set rotacionX(v) {
    this.#rotacion.x = v;
    this.#dirty = true;
  }
  set rotacionY(v) {
    this.#rotacion.y = v;
    this.#dirty = true;
  }
  set rotacionZ(v) {
    this.#rotacion.z = v;
    this.#dirty = true;
  }

  set escalaX(v) {
    this.#escala.x = v;
    this.#dirty = true;
  }
  set escalaY(v) {
    this.#escala.y = v;
    this.#dirty = true;
  }
  set escalaZ(v) {
    this.#escala.z = v;
    this.#dirty = true;
  }

  /**
   * Solo se retorna la matriz Mat3, no se actualiza desde aquí.
   * @returns {Mat3} Matriz local-a-mundo (2D)
   */
  get matriz() {
    return this.#matriz;
  }

  get dirty() {
    return this.#dirty;
  }

  set dirty(value) {
    if (typeof value !== "boolean") {
      console.error("dirty debe ser un boolean");
      return;
    }
    this.#dirty = value;
  }

}
