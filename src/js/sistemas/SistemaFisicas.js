export default class SistemaFisicas {
  #sistemaInput;
  #gestorEntidades;

  /**
   * @param {SistemaInput} sistemaInput Referencia al sistema de input para leer el teclado
   * @param {Object} gestorEntidades Objeto que contiene la lista de entidades
   */
  constructor(sistemaInput, gestorEntidades) {
    this.#sistemaInput = sistemaInput;
    this.#gestorEntidades = gestorEntidades;
  }

  update(deltaTime) {
    const listaEntidades = this.#gestorEntidades.lista || [];

    for (const entidad of listaEntidades) {
      // Solo nos importan las entidades que se pueden mover (tienen física/velocidad)
      // y tienen una posición en el mundo (Transform)
      if (!entidad.transform || !entidad.fisica) continue;

      const transform = entidad.transform;
      const fisica = entidad.fisica;

      // 1. APLICAR INPUT A LA VELOCIDAD (Si la entidad es controlable)
      if (entidad.esControlable) {
        fisica.velocidadX = 0;
        fisica.velocidadY = 0;

        const velocidadMovimiento = 5; // Unidades por segundo

        if (this.#sistemaInput.estaPresionada("ArrowUp") || this.#sistemaInput.estaPresionada("KeyW")) {
          fisica.velocidadY = velocidadMovimiento;
        }
        if (this.#sistemaInput.estaPresionada("ArrowDown") || this.#sistemaInput.estaPresionada("KeyS")) {
          fisica.velocidadY = -velocidadMovimiento;
        }
        if (this.#sistemaInput.estaPresionada("ArrowLeft") || this.#sistemaInput.estaPresionada("KeyA")) {
          fisica.velocidadX = -velocidadMovimiento;
        }
        if (this.#sistemaInput.estaPresionada("ArrowRight") || this.#sistemaInput.estaPresionada("KeyD")) {
          fisica.velocidadX = velocidadMovimiento;
        }
      }

      // 2. APLICAR VELOCIDAD A LA POSICIÓN (Basado en el deltaTime)
      // deltaTime asegura que si el juego va a 30fps o a 60fps, el objeto se mueva a la misma velocidad real
      transform.x += fisica.velocidadX * deltaTime;
      transform.y += fisica.velocidadY * deltaTime;
    }
  }
}
