export default class SistemaEntrada3D {
  /**
   * @param {import('../core/Escena.js').default} escena
   * @param {HTMLCanvasElement} canvas
   * @param {number} filas
   * @param {number} columnas
   * @param {number} nivelesCount
   * @param {string[]} idsNiveles
   * @param {string} cursorId
   */
  constructor(
    escena,
    canvas,
    filas,
    columnas,
    nivelesCount,
    idsNiveles,
    cursorId,
  ) {
    this.escena = escena;
    this.canvas = canvas;
    this.filas = filas;
    this.columnas = columnas;
    this.nivelesCount = nivelesCount;
    this.idsNiveles = idsNiveles; // Array con los IDs de las entidades de tablero
    this.cursorId = cursorId;

    this.ultimaCeldaClickeada = null; // { nivel, fila, col }

    // Hover
    this.casillaHoverGrid = null; // { nivel, fila, col }
    this.config3D = null; // Inyectado desde el boundary

    this.canvas.addEventListener("mousemove", this.#onMouseMove.bind(this));
    this.canvas.addEventListener("click", this.#onClick.bind(this));
    this.canvas.addEventListener("mouseleave", () => {
      this.casillaHoverGrid = null;
      if (this.cursorId) {
        const cursor = this.escena.obtenerEntidadPorId(this.cursorId);
        if (cursor && cursor.transform) {
          cursor.transform.escalaX = 0;
          cursor.transform.escalaY = 0;
          cursor.transform.dirty = true;
        }
      }
    });
  }

  #onMouseMove(evento) {
    if (!this.config3D) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX =
      (evento.clientX - rect.left) * (this.canvas.width / rect.width);
    const mouseY =
      (evento.clientY - rect.top) * (this.canvas.height / rect.height);

    let hoverEncontrado = null;

    // Iterar niveles de frente (nivelesCount - 1) hacia atrás (0) para que el frente tape al fondo
    for (let n = this.nivelesCount - 1; n >= 0; n--) {
      // Obtener el transform real del grid de este nivel
      const gridId = this.idsNiveles[n];
      const gridEntidad = this.escena.obtenerEntidadPorId(gridId);
      if (!gridEntidad || !gridEntidad.transform) continue;

      const tf = gridEntidad.transform;
      tf.actualizarMatriz(); // Asegurar que la matriz T·R·S esté al día

      const invMat = tf.matriz.inversa();
      if (!invMat) continue;

      // Transformar coord del canvas a coord local del grid (-ancho/2 a +ancho/2)
      const [localX, localY] = invMat.transformarPunto(mouseX, mouseY);

      const anchoCelda = this.config3D.anchoPx / this.columnas;
      const altoCelda = this.config3D.altoPx / this.filas;

      const bordeIzq = -this.config3D.anchoPx / 2;
      const bordeSup = -this.config3D.altoPx / 2;

      // Calcular a qué celda corresponde en el espacio local no rotado
      const col = Math.floor((localX - bordeIzq) / anchoCelda);
      const fila = Math.floor((localY - bordeSup) / altoCelda);

      // Limitar a los bounds del grid local
      if (fila >= 0 && fila < this.filas && col >= 0 && col < this.columnas) {
        hoverEncontrado = { nivel: n, fila, col };
        break; // Detenerse en el primer nivel que intercepte (el más al frente)
      }
    }

    this.casillaHoverGrid = hoverEncontrado;

    // Actualizar hover en CasillaComponent y mover el cursor visual
    const entidadesCasilla = this.escena.consultarPorComponente("casilla");
    const cursor = this.cursorId
      ? this.escena.obtenerEntidadPorId(this.cursorId)
      : null;
    let casillaLibre = false;

    for (const entidad of entidadesCasilla) {
      const c = entidad.casilla;
      const esHover =
        hoverEncontrado &&
        c.nivel === hoverEncontrado.nivel &&
        c.fila === hoverEncontrado.fila &&
        c.columna === hoverEncontrado.col;
      c.hover = esHover && c.estado === "vacia";

      if (c.hover) casillaLibre = true;
    }

    if (cursor && cursor.transform) {
      if (hoverEncontrado && casillaLibre) {
        // Encontrar el grid sobre el que estamos para copiar su transformación
        const gridEntidad = this.escena.obtenerEntidadPorId(
          this.idsNiveles[hoverEncontrado.nivel],
        );

        if (gridEntidad && gridEntidad.transform) {
          const tfGrid = gridEntidad.transform;

          // Calcular la posición local del centro de la celda
          const anchoCelda = this.config3D.anchoPx / this.columnas;
          const altoCelda = this.config3D.altoPx / this.filas;
          const bordeIzq = -this.config3D.anchoPx / 2;
          const bordeSup = -this.config3D.altoPx / 2;

          const centroCeldaLocalX =
            bordeIzq + (hoverEncontrado.col + 0.5) * anchoCelda;
          const centroCeldaLocalY =
            bordeSup + (hoverEncontrado.fila + 0.5) * altoCelda;

          // Transformar la posición local a posición de mundo usando la matriz del grid
          tfGrid.actualizarMatriz();
          let mundoX,
            mundoY,
            mundoZ = 0;
          if (tfGrid.modo3D && tfGrid.matriz4) {
            const p3d = tfGrid.matriz4.transformarPunto3D(
              centroCeldaLocalX,
              centroCeldaLocalY,
              0,
            );
            mundoX = p3d[0];
            mundoY = p3d[1];
            mundoZ = p3d[2];
          } else {
            const p2d = tfGrid.matriz.transformarPunto(
              centroCeldaLocalX,
              centroCeldaLocalY,
            );
            mundoX = p2d[0];
            mundoY = p2d[1];
          }

          cursor.transform.posicion.x = mundoX;
          cursor.transform.posicion.y = mundoY;
          cursor.transform.posicion.z = mundoZ - 0.1; // Offset para evitar Z-fighting con la celda
          // Copiamos la rotación y escala para que el cursor se dibuje deformado igual que el grid
          cursor.transform.rotacionZ = tfGrid.rotacionZ;
          cursor.transform.rotacionX = tfGrid.rotacionX;
          cursor.transform.rotacionY = tfGrid.rotacionY;
          cursor.transform.escalaX = tfGrid.escalaX;
          cursor.transform.escalaY = tfGrid.escalaY;

          cursor.transform.dirty = true;
          cursor.render.visible = true;
        }
      } else {
        // Ocultar
        cursor.render.visible = false;
      }
    }
  }

  #onClick() {
    if (this.casillaHoverGrid) {
      this.ultimaCeldaClickeada = { ...this.casillaHoverGrid };
      // actualizar grid
      this.casillaHoverGrid = null;
      const cursor = this.escena.obtenerEntidadPorId(this.cursorId);
      if (cursor && cursor.render) {
        cursor.render.visible = false;
      }
      //console.log("Celda clickeada: ", this.ultimaCeldaClickeada);
    }
  }

  update() {
    // Aquí podríamos actualizar entidades de cursor hover 3D
  }
}
