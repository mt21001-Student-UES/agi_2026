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
    this.escena   = escena;
    this.canvas   = canvas;
    this.filas    = filas;
    this.columnas = columnas;
    this.cursorId = cursorId;

    // Última celda clickeada (leída y borrada por SistemaJuegoAmoeba)
    this.ultimaCeldaClickeada = null;

    // Hover actual en coordenadas de grilla
    this.casillaHoverGrid = null;  // { fila, col } | null
    // Mantenido para compatibilidad con SistemaJuegoAmoeba (ya no se usa para NDC)
    this.casillaHoverNDC  = null;

    // Offsets del tablero en píxeles (inyectados desde boundary)
    // offsetX/Y = borde izquierdo/superior del tablero en px
    // anchoCelda/altoCelda = tamaño de cada celda en px
    // Si no se inyectan, se calculan dinámicamente a partir del tamaño del canvas
    this.offsetX    = null;
    this.offsetY    = null;
    this.anchoCelda = null;
    this.altoCelda  = null;

    this.canvas.addEventListener("mousemove",  this.#onMouseMove.bind(this));
    this.canvas.addEventListener("click",      this.#onClick.bind(this));
    this.canvas.addEventListener("mouseleave", () => {
      this.casillaHoverNDC  = null;
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

    if (fila < 0 || fila >= this.filas || col < 0 || col >= this.columnas) {
      this.casillaHoverNDC  = null;
      this.casillaHoverGrid = null;
      return;
    }

    this.casillaHoverGrid = { fila, col };

    // Calcular el centro de la casilla en píxeles canvas
    const aCelda = this.anchoCelda ?? (this.canvas.width  / this.columnas);
    const hCelda = this.altoCelda  ?? (this.canvas.height / this.filas);
    const offX   = this.offsetX ?? 0;
    const offY   = this.offsetY ?? 0;
    const cx = offX + (col  + 0.5) * aCelda;
    const cy = offY + (fila + 0.5) * hCelda;

    // Mantener NDC por compatibilidad (algunos sistemas pueden leerlo)
    this.casillaHoverNDC = {
      x: (cx / this.canvas.width)  * 2 - 1,
      y: 1 - (cy / this.canvas.height) * 2,
    };

    // Actualizar estado hover en los CasillaComponents
    const entidadesCasilla = this.escena.consultarPorComponente("casilla");
    for (const entidad of entidadesCasilla) {
      const c = entidad.casilla;
      c.hover = (c.fila === fila && c.columna === col && c.estado === "vacia");
    }

    // Mover el cursor visual al centro de la casilla en píxeles
    const cursor  = this.escena.obtenerEntidadPorId(this.cursorId);
    const casilla = entidadesCasilla.find(
      (e) => e.casilla.fila === fila && e.casilla.columna === col,
    );
    if (cursor && cursor.transform) {
      if (casilla && casilla.casilla.estado === "vacia") {
        cursor.transform.x      = cx;
        cursor.transform.y      = cy;
        cursor.transform.escala = 1;   // visible
        cursor.transform._dirty = true; // forzar recalculo de matriz
      } else {
        cursor.transform.escala = 0;   // oculto si está ocupada
        cursor.transform._dirty = true;
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
