/**
 * SistemaEntradaGrid
 * ------------------
 * Escucha los eventos del ratón en el canvas y los traduce a coordenadas (fila, columna)
 * del tablero. Actualiza el componente CasillaComponent de la entidad correspondiente.
 */
export default class SistemaEntradaGrid {
  /**
   * @param {import('../core/Escena.js').default} escena
   * @param {HTMLCanvasElement} canvas
   * @param {number} filas
   * @param {number} columnas
   * @param {number} cursorId
   */
  constructor(escena, canvas, filas, columnas, cursorId) {
    this.escena = escena;
    this.canvas = canvas;
    this.filas = filas;
    this.columnas = columnas;
    this.cursorId = cursorId;

    // Almacena la última celda clickeada para que el SistemaJuego la lea
    this.ultimaCeldaClickeada = null;

    // Posición NDC del centro de la celda bajo el mouse (null = fuera del canvas)
    // Otros sistemas (ej. SistemaJuegoAmoeba) la leen para mover el cursor de hover
    this.casillaHoverNDC = null; // { x, y } | null
    this.casillaHoverGrid = null; // { fila, col } | null

    // Vincular eventos del DOM
    this.canvas.addEventListener("mousemove", this.#onMouseMove.bind(this));
    this.canvas.addEventListener("click", this.#onClick.bind(this));
    this.canvas.addEventListener("mouseleave", () => {
      this.casillaHoverNDC = null;
      this.casillaHoverGrid = null;
    });
  }

  update(deltaTime) {
    // Este sistema actualiza componentes basándose en eventos asíncronos del ratón.
    
  }

  #obtenerFilaColumna(evento) {
    const rect = this.canvas.getBoundingClientRect();
    const x = evento.clientX - rect.left;
    const y = evento.clientY - rect.top;

    // Asumimos que el grid cubre todo el canvas de forma uniforme
    const anchoCasilla = this.canvas.width / this.columnas;
    const altoCasilla = this.canvas.height / this.filas;

    const col = Math.floor(x / anchoCasilla);
    const fila = Math.floor(y / altoCasilla);

    return { fila, col };
  }

  #onMouseMove(evento) {
    const { fila, col } = this.#obtenerFilaColumna(evento);

    // Fuera de límites → limpiar hover
    if (fila < 0 || fila >= this.filas || col < 0 || col >= this.columnas) {
      this.casillaHoverNDC = null;
      this.casillaHoverGrid = null;
      return;
    }

    // Calcular NDC del centro de la celda
    const x_ndc = -1.0 + (col + 0.5) * (2.0 / this.columnas);
    const y_ndc = 1.0 - (fila + 0.5) * (2.0 / this.filas);

    this.casillaHoverNDC = { x: x_ndc, y: y_ndc };
    this.casillaHoverGrid = { fila, col };

    // Actualizar estado de hover en los CasillaComponents
    const entidadesCasilla = this.escena.consultarPorComponente("casilla");
    for (const entidad of entidadesCasilla) {
      const casilla = entidad.casilla;
      casilla.hover =
        casilla.fila === fila &&
        casilla.columna === col &&
        casilla.estado === "vacia";
    }

    // Mover el cursor visual
    const cursor = this.escena.obtenerEntidadPorId(this.cursorId);
    const casilla = entidadesCasilla.find(
      (c) => c.casilla.fila === fila && c.casilla.columna === col,
    );
    if (cursor && cursor.transform) {
      if (casilla && casilla.casilla.estado === "vacia") {
        cursor.transform.x = x_ndc;
        cursor.transform.y = y_ndc;
        cursor.transform.escala = 1; // visible
      } else {
        cursor.transform.escala = 0; // ocultar si está ocupada
      }
    }
  }

  #onClick(evento) {
    const { fila, col } = this.#obtenerFilaColumna(evento);

    if (fila < 0 || fila >= this.filas || col < 0 || col >= this.columnas)
      return;

    //console.log(`[Grid] Clic registrado en Fila: ${fila}, Col: ${col}`);
    this.ultimaCeldaClickeada = { fila, col };
  }
}
