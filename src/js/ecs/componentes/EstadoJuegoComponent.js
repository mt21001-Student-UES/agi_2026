/**
 * EstadoJuegoComponent
 * --------------------
 * Datos del gestor del juego Amoeba.
 *
 * @param {"PvP" | "PvE" | "EvE"} modoJuego - Modo de juego
 * @param {"Jugador 1" | "Jugador 2"} turnoActual - Turno actual
 */
export default class EstadoJuegoComponent {
  #MODOS = { PVP: "PvP", PVE: "PvE", EVE: "EvE" };
  #JUGADORES = { J1: "jugador 1", J2: "jugador 2" };
  constructor({
    turnoActual = this.#JUGADORES.J1,
    modoJuego = this.#MODOS.PVP,
    juegoTerminado = false,
    ganador = null,
  }) {
    const defaults = {
      modo: this.#MODOS.PVP,
      turnoActual: this.#JUGADORES.J1,
      juegoTerminado: false,
      ganador: null,
    };
    this.turnoActual = turnoActual || defaults.turnoActual; // 'jugador1' (equis) o 'jugador2' (cero)
    this.modoJuego = modoJuego || defaults.modoJuego; // 'PvP' (Player vs Player), 'PvE' (Player vs Engine), 'EvE' (Engine vs Engine)
    this.juegoTerminado = juegoTerminado || defaults.juegoTerminado;
    this.ganador = ganador || defaults.ganador; // 'jugador1', 'jugador2', 'empate', null
  }

  get MODOS() {
    return this.#MODOS;
  }

  get JUGADORES() {
    return this.#JUGADORES;
  }

  setModo(modo) {
    const normalizado = modo.toUpperCase();
    const posibles = Object.values(this.#MODOS);
    this.modoJuego =
      this.#MODOS[normalizado] ||
      posibles.find((v) => v === modo) ||
      this.#MODOS.PVP;
  }

  cambiarTurno() {
    this.turnoActual =
      this.turnoActual === this.JUGADORES.J1
        ? this.JUGADORES.J2
        : this.JUGADORES.J1;
  }

  reset() {
    this.turnoActual = this.#JUGADORES.J1;
    this.juegoTerminado = false;
    this.ganador = null;
  }
}
