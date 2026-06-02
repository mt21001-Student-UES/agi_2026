export default class SistemaInput {
  #teclasActivas;
  #manejarKeyDown;
  #manejarKeyUp;

  constructor() {
    this.#teclasActivas = {};

    // Aseguramos que 'this' apunte a la instancia en los callbacks
    this.#manejarKeyDown = this.#manejarKeyDown.bind(this);
    this.#manejarKeyUp = this.#manejarKeyUp.bind(this);

    // Escuchamos los eventos del DOM globalmente
    window.addEventListener("keydown", this.#manejarKeyDown);
    window.addEventListener("keyup", this.#manejarKeyUp);
  }

  #manejarKeyDown(evento) {
    // evento.code nos da valores como 'ArrowUp', 'KeyW', 'Space' independientemente del idioma del teclado
    this.#teclasActivas[evento.code] = true;
  }

  #manejarKeyUp(evento) {
    this.#teclasActivas[evento.code] = false;
  }

  /**
   * Permite a otros sistemas consultar si una tecla está presionada en este frame
   * @param {string} codigoTecla Código de la tecla (ej: 'ArrowRight')
   * @returns {boolean}
   */
  estaPresionada(codigoTecla) {
    return !!this.#teclasActivas[codigoTecla];
  }

  /**
   * Método de la interfaz Sistema.
   * El DOM actualiza el teclado de forma asíncrona, por lo que a veces 
   * el update no necesita hacer nada aquí, pero es útil si quisieras 
   * calcular cosas como "tecla recién presionada este frame" (justPressed).
   * @param {number} deltaTime 
   */
  update(deltaTime) {
    // En sistemas más complejos aquí se limpiaría el estado de "teclas presionadas hace 1 frame"
  }

  /**
   * Buenas prácticas: Limpiar listeners si alguna vez destruyes el juego
   */
  destruir() {
    window.removeEventListener("keydown", this.#manejarKeyDown);
    window.removeEventListener("keyup", this.#manejarKeyUp);
  }
}
