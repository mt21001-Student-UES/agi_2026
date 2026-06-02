/**
 * EstadoJuegoComponent
 * --------------------
 * Datos del gestor del juego Amoeba.
 */
export default class EstadoJuegoComponent {
  constructor({
    turnoActual = 'jugador1',
    modoJuego = 'PvP',
    juegoTerminado = false,
    ganador = null
  }) {
    this.turnoActual = turnoActual; // 'jugador1' (equis) o 'jugador2' (cero)
    this.modoJuego = modoJuego; // 'PvP' (Player vs Player), 'PvE' (Player vs Engine), 'EvE' (Engine vs Engine)
    this.juegoTerminado = juegoTerminado;
    this.ganador = ganador; // 'jugador1', 'jugador2', 'empate', null
  }
}
