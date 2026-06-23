import EquisFactory from "../ecs/factories/EquisFactory.js";
import CeroFactory from "../ecs/factories/CeroFactory.js";
import Cuadrado from "../graficos/figuras/Cuadrado.js";
import {
  GeometriaComponent,
  RenderComponent,
  TransformComponent,
} from "../ecs/Componentes.js";

export default class SistemaJuego3D {
  constructor(escena) {
    this.escena = escena;
    this.entrada = null;
    this.modo = null;
    this.estadoId = null;
    this.uiTurno = null;
    this.config3D = null;
    this.tiempoIA = 0;
    this.delayIA = 1000;
    this.iaPensando = false;
  }

  update(deltaTime) {
    if (!this.entrada || !this.estadoId) return;

    const estadoEntidad = this.escena.obtenerEntidadPorId(this.estadoId);
    if (!estadoEntidad || estadoEntidad.estadoJuego.juegoTerminado) return;

    const estado = estadoEntidad.estadoJuego;

    // --- PvP: ambos son humanos ---
    if (estado.modoJuego === estado.MODOS.PVP) {
      if (this.entrada.ultimaCeldaClickeada) {
        const { nivel, fila, col } = this.entrada.ultimaCeldaClickeada;
        this.entrada.ultimaCeldaClickeada = null;
        this.jugarTurno(nivel, fila, col, estado);
      }
      return;
    }

    // --- PvE: humano (jugador 1) vs IA (jugador 2) ---
    if (estado.modoJuego === estado.MODOS.PVE) {
      if (estado.turnoActual === estado.JUGADORES.J1) {
        // turno humano
        if (this.entrada.ultimaCeldaClickeada) {
          const { nivel, fila, col } = this.entrada.ultimaCeldaClickeada;
          this.entrada.ultimaCeldaClickeada = null;
          this.jugarTurno(nivel, fila, col, estado);
        }
      } else {
        // turno IA
        this.procesarTurnoIA(deltaTime, estado);
      }
      return;
    }

    // --- EvE: siempre IA, alternando jugadores ---
    if (estado.modoJuego === estado.MODOS.EVE) {
      this.procesarTurnoIA(deltaTime, estado);
      return;
    }

    throw Error("Modo de juego inválido");
  }

  // Método auxiliar para IA
  procesarTurnoIA(deltaTime, estado) {
    if (!this.iaPensando) {
      this.iaPensando = true;
      this.tiempoIA = 0;
    }

    this.tiempoIA += deltaTime * 1000;
    if (this.tiempoIA >= this.delayIA) {
      this.iaPensando = false;
      this.jugadaIA(estado);
    }
  }

  /**
   * @param {*} estado
   */
  jugadaIA(estado) {
    const entidadesCasilla = this.escena.consultarPorComponente("casilla");
    const vacias = entidadesCasilla.filter((e) => e.casilla.estado === "vacia");
    if (vacias.length === 0) return;

    // 1. Intentar bloquear al jugador humano
    const amenaza = vacias.find((casilla) => {
      // Simular jugada del humano en esta casilla
      casilla.casilla.estado =
        estado.JUGADORES.J1 === estado.turnoActual ? "cero" : "equis";
      const victoria = this.verificarVictoria3D(
        estado,
        casilla.casilla.nivel,
        casilla.casilla.fila,
        casilla.casilla.columna,
        casilla.casilla.estado,
        true, // soloSimulacion
      );
      casilla.casilla.estado = "vacia"; // revertir simulación
      return victoria;
    });

    if (amenaza) {
      this.jugarTurno(
        amenaza.casilla.nivel,
        amenaza.casilla.fila,
        amenaza.casilla.columna,
        estado,
      );
      return;
    }

    // 2. Si no hay amenaza, jugar aleatorio
    const random = vacias[Math.floor(Math.random() * vacias.length)];
    this.jugarTurno(
      random.casilla.nivel,
      random.casilla.fila,
      random.casilla.columna,
      estado,
    );
  }

  jugarTurno(nivel, fila, col, estado) {
    // 1. Obtener la entidad casilla
    const entidadesCasilla = this.escena.consultarPorComponente("casilla");
    const entidadCasilla = entidadesCasilla.find(
      (e) =>
        e.casilla.nivel === nivel &&
        e.casilla.fila === fila &&
        e.casilla.columna === col,
    );

    // 2. Verificar que la casilla este vacia
    if (!entidadCasilla || entidadCasilla.casilla.estado !== "vacia") {
      console.warn("Celda ya ocupada o juego terminado");
      return; // La casilla no es válida o ya está ocupada
    }

    // 3. Marcar la casilla con el jugador pasado como argumento
    const jugadorQueJuega = estado.turnoActual;
    const marcaGuardada =
      jugadorQueJuega === estado.JUGADORES.J1 ? "equis" : "cero";
    entidadCasilla.casilla.estado = marcaGuardada;

    // Obtener la matriz real del tablero de este nivel
    const gridId = this.idsNiveles[nivel];
    const gridEntidad = this.escena.obtenerEntidadPorId(gridId);
    const tfGrid = gridEntidad.transform;
    tfGrid.actualizarMatriz(); // Asegurar matriz actualizada

    // Calcular centro de la celda en coordenadas locales (del tablero)
    const localX = -this.config3D.anchoPx / 2 + (col + 0.5) * this.anchoCelda;
    const localY = -this.config3D.altoPx / 2 + (fila + 0.5) * this.altoCelda;

    // Transformar a coordenadas del mundo (aplicando rotación isómetrica del nivel)
    let mundoX,
      mundoY,
      mundoZ = 0;
    if (tfGrid.modo3D && tfGrid.matriz4) {
      const p3d = tfGrid.matriz4.transformarPunto3D(localX, localY, 0);
      mundoX = p3d[0];
      mundoY = p3d[1];
      mundoZ = p3d[2];
    } else {
      const p2d = tfGrid.matriz.transformarPunto(localX, localY);
      mundoX = p2d[0];
      mundoY = p2d[1];
    }

    const size = Math.min(this.anchoCelda, this.altoCelda) * 0.35;

    // Crear marca
    let markFactory;
    if (jugadorQueJuega === estado.JUGADORES.J1) {
      markFactory = new EquisFactory(this.escena, {
        posicion: { x: mundoX, y: mundoY, z: mundoZ - 0.1 },
        tamaño: size,
        color: [1, 0, 0],
        volumen3D: true,
        mat4: true,
        rellenarCaras: true,
      });
    } else {
      markFactory = new CeroFactory(this.escena, {
        posicion: { x: mundoX, y: mundoY, z: mundoZ - 0.1 },
        tamaño: size,
        color: [0, 0, 1],
        volumen3D: true,
        mat4: true,
        rellenarCaras: true,
      });
    }
    markFactory.construir();

    // 4. Ajustar transformación de la marca para que coincida con el tablero
    const markEntity = markFactory.entidad;
    if (markEntity.transform && markEntity.animacionEfecto) {
      markEntity.animacionEfecto.escalaFinalX = tfGrid.escalaX;
      markEntity.animacionEfecto.escalaFinalY = tfGrid.escalaY;

      // Copiar rotaciones del tablero
      markEntity.transform.rotacionX = tfGrid.rotacionX;
      markEntity.transform.rotacionY = tfGrid.rotacionY;
      markEntity.transform.rotacionZ = tfGrid.rotacionZ;

      markEntity.transform.escalaX = 0; // Animación empieza desde 0
      markEntity.transform.escalaY = 0;
      markEntity.transform.dirty = true;
    }

    // 5. Ajustar orden de render para pintar encima del grid
    if (markEntity.render) {
      markEntity.render.orden = nivel + 0.1;
    }

    // 6. Evaluar victoria con la marca del jugador que acaba de jugar
    if (this.verificarVictoria3D(estado, nivel, fila, col, marcaGuardada)) {
      return;
    }
    // Alternar turno
    estado.cambiarTurno();
    // Actualizar UI
    if (this.uiTurno) {
      this.uiTurno.textContent =
        estado.turnoActual === estado.JUGADORES.J1
          ? "Jugador 1 (Equis)"
          : "Jugador 2 (Cero)";
      this.uiTurno.style.color =
        estado.turnoActual === estado.JUGADORES.J1 ? "#ff4757" : "#1e90ff";
    }
  }

  obtenerEstadoCasilla(nivel, fila, columna) {
    if (
      nivel < 0 ||
      nivel >= 3 ||
      fila < 0 ||
      fila >= 3 ||
      columna < 0 ||
      columna >= 3
    )
      return null;
    const entidadesCasilla = this.escena.consultarPorComponente("casilla");
    const entidadCasilla = entidadesCasilla.find(
      (e) =>
        e.casilla.nivel === nivel &&
        e.casilla.fila === fila &&
        e.casilla.columna === columna,
    );
    return entidadCasilla ? entidadCasilla.casilla.estado : null;
  }

  verificarVictoria3D(
    estado,
    nivelOrig,
    filaOrig,
    colOrig,
    marca,
    soloSimulacion = false,
  ) {
    //if (!soloSimulacion) console.log("Verificando victoria con marca: ", marca);
    // Los 13 ejes únicos en un espacio 3D (x, y, z)
    const ejes = [
      [0, 0, 1], // Horizontal plana
      [0, 1, 0], // Vertical plana
      [0, 1, 1], // Diagonal plana /
      [0, 1, -1], // Diagonal plana \
      [1, 0, 0], // Vertical inter-nivel (misma col, misma fila)
      [1, 0, 1], // Diagonal inter-nivel X (mueve col y nivel)
      [1, 0, -1],
      [1, 1, 0], // Diagonal inter-nivel Y (mueve fila y nivel)
      [1, -1, 0],
      [1, 1, 1], // Diagonal corporal cruzada 3D
      [1, 1, -1],
      [1, -1, 1],
      [1, -1, -1],
    ];

    for (const [dn, df, dc] of ejes) {
      let count = 1;
      let casillasGanadoras = [
        { nivel: nivelOrig, fila: filaOrig, col: colOrig },
      ];

      // Escanear hacia "adelante" (+1, +2)
      for (let i = 1; i < 3; i++) {
        const n = nivelOrig + dn * i;
        const f = filaOrig + df * i;
        const c = colOrig + dc * i;
        if (this.obtenerEstadoCasilla(n, f, c) === marca) {
          count++;
          casillasGanadoras.push({ nivel: n, fila: f, col: c });
        } else break; // Se rompió la línea
      }

      // Escanear hacia "atrás" (-1, -2)
      for (let i = 1; i < 3; i++) {
        const n = nivelOrig - dn * i;
        const f = filaOrig - df * i;
        const c = colOrig - dc * i;
        if (this.obtenerEstadoCasilla(n, f, c) === marca) {
          count++;
          casillasGanadoras.push({ nivel: n, fila: f, col: c });
        } else break; // Se rompió la línea
      }

      if (count >= 3) {
        if (soloSimulacion) return true;

        // Ordenar casillas para obtener fácilmente los extremos de la línea
        casillasGanadoras.sort((a, b) => {
          if (a.nivel !== b.nivel) return a.nivel - b.nivel;
          if (a.fila !== b.fila) return a.fila - b.fila;
          return a.col - b.col;
        });

        estado.juegoTerminado = true;
        estado.ganador = marca === "equis" ? 1 : 2;

        this.#dibujarLineaVictoria(
          casillasGanadoras[0],
          casillasGanadoras[casillasGanadoras.length - 1],
        );

        if (this.uiTurno) {
          this.uiTurno.textContent = `¡GANA JUGADOR ${estado.ganador}!`;
          this.uiTurno.style.color = "#00d2d3";

          setTimeout(() => {
            document.dispatchEvent(
              new CustomEvent("juegoTerminado", {
                detail: { ganador: estado.ganador },
              }),
            );
          }, 500);
        }

        return true;
      }
    }

    // Revisar Empate
    const entidadesCasilla = this.escena.consultarPorComponente("casilla");
    const vacias = entidadesCasilla.filter((e) => e.casilla.estado === "vacia");
    if (vacias.length === 0) {
      if (soloSimulacion) return false;

      estado.juegoTerminado = true;
      estado.ganador = "empate";
      if (this.uiTurno) {
        this.uiTurno.textContent = "¡EMPATE!";
        this.uiTurno.style.color = "#888";
      }
      return true;
    }

    return false;
  }

  #calcularMundo(casilla) {
    const gridId = this.idsNiveles[casilla.nivel];
    const gridEntidad = this.escena.obtenerEntidadPorId(gridId);
    const tfGrid = gridEntidad.transform;

    const localX =
      -this.config3D.anchoPx / 2 + (casilla.col + 0.5) * this.anchoCelda;
    const localY =
      -this.config3D.altoPx / 2 + (casilla.fila + 0.5) * this.altoCelda;

    tfGrid.actualizarMatriz();
    if (tfGrid.modo3D && tfGrid.matriz4) {
      const p3d = tfGrid.matriz4.transformarPunto3D(localX, localY, 0);
      return [p3d[0], p3d[1], p3d[2], tfGrid];
    } else {
      const p2d = tfGrid.matriz.transformarPunto(localX, localY);
      return [p2d[0], p2d[1], 0, tfGrid];
    }
  }

  #dibujarLineaVictoria(casillaA, casillaB) {
    // --- extremos en 3D ---
    const [xA, yA, zA, tfGridA] = this.#calcularMundo(casillaA);
    const [xB, yB, zB, tfGridB] = this.#calcularMundo(casillaB);

    // --- centro del segmento ---
    const centroX = (xA + xB) / 2;
    const centroY = (yA + yB) / 2;
    const centroZ = (zA + zB) / 2;

    // --- orientación en 3D ---
    const dx = xB - xA;
    const dy = yB - yA;
    const dz = zB - zA;

    // Distancia real en 3D
    const L = Math.hypot(dx, dy, dz);
    const L_xy = Math.hypot(dx, dy) || 0.0001; // Evitar división por cero

    // Para evitar que la línea pierda grosor por la perspectiva (especialmente en
    // líneas verticales sobre el tablero), forzamos que su vector normal (el grosor)
    // se mantenga siempre paralelo al plano de la pantalla (Z=0) en espacio mundo.
    // Esto se logra con una matriz ortonormal específica convertida a ángulos de Euler.
    const rotX = Math.atan2(dy * dz, L_xy * L_xy);
    const rotY = Math.asin(Math.max(-1, Math.min(1, (-dx * dz) / (L * L_xy))));
    const rotZ = Math.atan2(dy * L, dx * L_xy);

    const lineaVictoria = this.escena.crearEntidad("LineaVictoria");

    // El cuadrado se define con ancho = longitud de la línea, alto = grosor fijo
    const grosor = this.anchoCelda * 0.2; // por ejemplo, 20% del tamaño de celda
    const figura = new Cuadrado(
      lineaVictoria.id,
      -L / 2,
      -grosor / 2,
      L / 2,
      grosor / 2,
      this.entrada.canvas,
      [1, 0.85, 0.1], // amarillo
      "lineaDDA",
      true,
      "frontera",
      [0.1, 0.1, 0.1],
    );

    this.escena.agregarComponente(
      lineaVictoria,
      new GeometriaComponent(figura),
    );
    this.escena.agregarComponente(
      lineaVictoria,
      new TransformComponent({
        posicion: { x: centroX, y: centroY, z: centroZ },
        rotacion: { x: rotX, y: rotY, z: rotZ },
        modo3D: true,
      }),
    );

    this.escena.agregarComponente(
      lineaVictoria,
      new RenderComponent("puntos3d", 2, 10, true),
    );
    console.log("Linea de victoria dibujada", lineaVictoria);
  }
}
