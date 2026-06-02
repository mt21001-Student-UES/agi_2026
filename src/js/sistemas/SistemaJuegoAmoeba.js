import EquisFactory from "../ecs/factories/EquisFactory.js";
import CeroFactory from "../ecs/factories/CeroFactory.js";

/**
 * SistemaJuegoAmoeba
 * ------------------
 * Máquina de estados para el 5 en raya.
 */
export default class SistemaJuegoAmoeba {
  constructor(escena) {
    this.escena = escena;

    // Obtenemos la entidad manager que guarda el estado
    this.estadoJuego = escena.obtenerEntidadPorNombre("EstadoJuegoAmoeba");
    if (!this.estadoJuego) {
      throw new Error(
        "[SistemaJuegoAmoeba] No se encontró la entidad que controla el estado del juego",
      );
    }

    // Variables auxiliares
    this.tiempoIA = 0; // contador de espera
    this.delayIA = 1000; // 1 segundo de demora
    this.iaPensando = false; // flag para saber si la IA está "pensando"
  }

  update(deltaTime) {
    // 1. Obtener estado del juego (usamos la referencia a la entidad que tiene el componente de Estado)
    if (!this.estadoJuego) return;
    const estado = this.estadoJuego.estadoJuego;
    if (estado.juegoTerminado) return;

    const modo = estado.modoJuego; // 'PvP' | 'PvE' | 'EvE'
    const turnoActual = estado.turnoActual;

    // 2. Leer inputs (clics validados por SistemaEntradaGrid)

    if (
      estado.modoJuego === "PvP" ||
      (estado.modoJuego === "PvE" && estado.turnoActual === "jugador1")
    ) {
      //console.log("Juega humano");
      if (this.entrada && this.entrada.ultimaCeldaClickeada) {
        const { fila, col } = this.entrada.ultimaCeldaClickeada;
        this.entrada.ultimaCeldaClickeada = null;
        this.jugarTurno(fila, col, estado);
      }
      return;
    }

    // --- Lógica de IA ---
    //console.log("Juega IA");
    let esTurnoIA = false;
    if (modo === "PvE") {
      esTurnoIA = turnoActual === "jugador2";
    } else if (modo === "EvE") {
      esTurnoIA = true; // siempre IA, pero alterna con turnoActual
    }

    if (esTurnoIA && !this.iaPensando) {
      this.iaPensando = true;
      this.tiempoIA = 0;
    }

    if (this.iaPensando) {
      this.tiempoIA += deltaTime * 1000;
      if (this.tiempoIA >= this.delayIA) {
        this.iaPensando = false;
        this.jugadaIA(estado); // aquí la IA elige casilla vacía
      }
    }
  }

  jugarTurno(fila, col, estado) {
    // Limpiar el clic para no procesarlo dos veces
    this.entrada.ultimaCeldaClickeada = null;

    // Buscar la entidad de la casilla correspondiente
    const casillas = this.escena.consultarPorComponente("casilla");
    const entidadCasilla = casillas.find(
      (e) => e.casilla.fila === fila && e.casilla.columna === col,
    );

    if (entidadCasilla && entidadCasilla.casilla.estado === "vacia") {
      const turnoActual = estado.turnoActual; // 'jugador1' o 'jugador2'
      const estadoCasilla = turnoActual === "jugador1" ? "equis" : "cero";

      // 1. Marcar casilla como ocupada
      entidadCasilla.casilla.estado = estadoCasilla;

      // 2. Calcular coordenadas NDC del centro de la casilla
      const colF = this.entrada.columnas;
      const filF = this.entrada.filas;
      const x_ndc = -1.0 + (col + 0.5) * (2.0 / colF);
      const y_ndc = 1.0 - (fila + 0.5) * (2.0 / filF);
      const size = (2.0 / Math.max(colF, filF)) * 0.35;

      // 3. Instanciar la figura visual
      if (turnoActual === "jugador1") {
        new EquisFactory(this.escena, {
          x: x_ndc,
          y: y_ndc,
          size,
          color: [1, 0, 0],
        }).construir();
      } else {
        new CeroFactory(this.escena, {
          x: x_ndc,
          y: y_ndc,
          size: size * 1.15,
          color: [0, 0, 1],
        }).construir();
      }

      // 4. Verificar victoria ANTES de cambiar el turno (el jugador que acaba de poner)
      const ganador = this.verificarVictoria(fila, col, estadoCasilla);
      if (ganador) {
        const numGanador = ganador === "equis" ? 1 : 2;
        estado.juegoTerminado = true;
        estado.ganador = ganador;
        if (this.uiTurno) {
          this.uiTurno.textContent = `¡Jugador ${numGanador} ha ganado!`;
          this.uiTurno.style.color = "#2ecc71";
        }
        console.log(`[Amoeba] ¡Jugador ${numGanador} gana!`);
        document.dispatchEvent(
          new CustomEvent("juegoTerminado", {
            detail: { ganador: numGanador },
          }),
        );
        return;
      }

      // 5. Comprobar empate
      const casillas = this.escena.consultarPorComponente("casilla");
      const vacias = casillas.filter((c) => c.casilla.estado === "vacia");
      if (vacias.length === 0) {
        estado.juegoTerminado = true;
        estado.ganador = null; // empate
        if (this.uiTurno) {
          this.uiTurno.textContent = "¡Empate!";
          this.uiTurno.style.color = "#f39c12";
        }
        console.log("[Amoeba] ¡Empate!");
        document.dispatchEvent(
          new CustomEvent("juegoTerminado", {
            detail: { ganador: null },
          }),
        );
        return;
      }

      // 6. Cambiar turno
      estado.turnoActual = turnoActual === "jugador1" ? "jugador2" : "jugador1";

      // 7. Actualizar UI de turno
      if (this.uiTurno) {
        if (estado.turnoActual === "jugador1") {
          this.uiTurno.textContent = "Jugador 1 (Equis)";
          this.uiTurno.style.color = "#ff4757";
        } else {
          this.uiTurno.textContent = "Jugador 2 (Cero)";
          this.uiTurno.style.color = "#1e90ff";
        }
      }
    } else {
      console.warn(`[Amoeba] Casilla (${fila}, ${col}) ocupada o no válida.`);
    }
  }

  /**
   * Realiza una jugada de la máquina.
   * @param {EstadoJuegoComponent} estado Estado del juego
   */
  jugadaIA(estado) {
    const casillas = this.escena.consultarPorComponente("casilla");
    const vacias = casillas.filter((c) => c.casilla.estado === "vacia");

    if (vacias.length === 0) return;

    // Estrategia básica: elegir una casilla aleatoria
    const randomIndex = Math.floor(Math.random() * vacias.length);
    const { fila, columna } = vacias[randomIndex].casilla;

    this.jugarTurno(fila, columna, estado);
  }

  /**
   * Comprueba si el último movimiento produjo 5 en raya.
   * Usa 4 ejes bidireccionales (horizontal, vertical, 2 diagonales).
   * Suma la cadena hacia un lado y hacia el otro; si total >= 5, hay ganador.
   *
   * @param {number} fila  Fila de la última jugada
   * @param {number} col   Columna de la última jugada
   * @param {string} estadoCasilla  'equis' | 'cero'  (estado que se acaba de poner)
   * @returns {string|null}  El estado ganador ('equis' o 'cero') o null si no hay
   */
  verificarVictoria(fila, col, estadoCasilla) {
    // Obtenemos el mapa de casillas una sola vez (evita consultas O(n²))
    const todasLasCasillas = this.escena.consultarPorComponente("casilla");
    const mapa = new Map();
    for (const e of todasLasCasillas) {
      mapa.set(`${e.casilla.fila},${e.casilla.columna}`, e.casilla.estado);
    }

    // 4 ejes: [dfila, dcol]  (cada eje cubre ambos sentidos sumando adelante + atrás)
    const ejes = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diagonal ↘
      [1, -1], // diagonal ↗
    ];

    for (const [df, dc] of ejes) {
      let contador = 1; // cuenta la casilla recién colocada

      // Recorrer hacia adelante
      for (let k = 1; k < 5; k++) {
        const f = fila + df * k,
          c = col + dc * k;
        if (mapa.get(`${f},${c}`) === estadoCasilla) contador++;
        else break;
      }
      // Recorrer hacia atrás
      for (let k = 1; k < 5; k++) {
        const f = fila - df * k,
          c = col - dc * k;
        if (mapa.get(`${f},${c}`) === estadoCasilla) contador++;
        else break;
      }

      if (contador >= 5) return estadoCasilla; // hay ganador
    }

    return null; // sin ganador
  }
}
