export default class Motor {
  #sistemas;
  #corriendo;
  #ultimoTiempo;
  #idAnimacion;
  constructor() {
    this.#sistemas = []; // Lista de sistemas en orden de ejecución
    this.#corriendo = false;
    this.#ultimoTiempo = 0;
    this.#idAnimacion = null;
    
    // Aseguramos que 'this' apunte siempre a la instancia de la clase en el bucle
    this.bucle = this.#bucle.bind(this);
  }
  
  /**
   * Añade un sistema al pipeline de ejecución.
   * El orden en que los añadas será el orden en que se ejecuten.
   * @param {Object} sistema Objeto con un método update(deltaTime)
  */
  agregarSistema(sistema) {
    this.#sistemas.push(sistema);
  }
  
  /**
   * Inicia el bucle principal (Game Loop)
   */
  iniciar() {
    if (this.#corriendo) return;

    this.#corriendo = true;
    this.#ultimoTiempo = performance.now();
    this.#idAnimacion = requestAnimationFrame(this.bucle);

    console.log("Motor iniciado.");
  }

  /**
   * Detiene el bucle principal
   */
  detener() {
    this.#corriendo = false;
    if (this.#idAnimacion !== null) {
      cancelAnimationFrame(this.#idAnimacion);
      this.#idAnimacion = null;
    }
    console.log("Motor detenido.");
  }

  /**
   * El bucle que se ejecuta en cada frame
   * @param {number} tiempoActual Tiempo en milisegundos provisto por requestAnimationFrame
  */
  #bucle(tiempoActual) {
    //console.log(this.#corriendo);
    //console.log("bucle ejecutado");
    if (!this.#corriendo) return;

    // 1. Calcular deltaTime en segundos
    const deltaTime = (tiempoActual - this.#ultimoTiempo) / 1000;
    this.#ultimoTiempo = tiempoActual;

    // 2. Ejecutar cada sistema en orden (Input -> Lógica/Física -> Render)
    for (const sistema of this.#sistemas) {
      if (typeof sistema.update === "function") {
        sistema.update(deltaTime);
      }
    }

    // 3. Solicitar el siguiente frame
    this.#idAnimacion = requestAnimationFrame(this.bucle);
  }
}
