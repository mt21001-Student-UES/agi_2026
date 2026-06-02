export default class FiguraInterface {
  #id;
  #buffer;
  posicion;
  #rotacion;
  #escala;
  constructor(id, posicion = { x: 0, y: 0, z: 0 }) {
    if (new.target === FiguraInterface) {
      throw new Error("Figura es una clase abstracta");
    }

    this.#id = id;
    this.posicion = posicion;
    this.#buffer = new Float32Array();
    // Transformaciones
    this.#rotacion = { x: 0, y: 0, z: 0 };
    this.#escala = { x: 1, y: 1, z: 1 };
  }

  get id() {
    return this.#id;
  }

  /**
   *
   * @param {Array} data los puntos a dibujar
   */
  setBuffer(data) {
    if (Array.isArray(data)) {
      // Array normal o array de arrays
      this.#buffer = new Float32Array(data.flat());
    } else if (ArrayBuffer.isView(data)) {
      // TypedArray (Float32Array, Int32Array, etc.)
      this.#buffer = data;
    } else {
      console.warn("Formato de datos inválido para buffer");
    }
  }

  getBuffer() {
    return this.#buffer;
  }

  // Transformaciones básicas
  trasladar() {
    console.error("Not implemented yet");
  }

  rotar() {
    console.error("Not implemented yet");
  }

  escalar() {
    console.error("Not implemented yet");
  }

  set id(value) {
    this.#id = value;
  }
}
