import Motor from "../core/Motor.js";
import Escena from "../core/Escena.js";
import ModeloWebGL from "../graficos/ModeloWebGL.js";
import SistemaRender from "../sistemas/SistemaRender.js";
import SistemaAnimacion from "../sistemas/SistemaAnimacion.js";
import SistemaJuegoAmoeba from "../sistemas/SistemaJuegoAmoeba.js";
import SistemaEntradaGrid from "../sistemas/SistemaEntradaGrid.js";
import GridFactory from "../ecs/factories/GridFactory.js";
import Puntos from "../graficos/figuras/Puntos.js";
import {
  EstadoJuegoComponent,
  TransformComponent,
  RenderComponent,
} from "../ecs/Componentes.js";
import GeometriaComponent from "../ecs/componentes/GeometriaComponent.js";
import Cuadrado from "../graficos/figuras/Cuadrado.js";

// ── Elementos del DOM ────────────────────────────────────────────────────────
const uiConfig = document.getElementById("panel-configuracion");
const uiJuego = document.getElementById("panel-juego");
const panelResultado = document.getElementById("panel-resultado");
const textoResultado = document.getElementById("textoResultado");
const btnStart = document.getElementById("btnIniciarJuego");
const btnCancelar = document.getElementById("btnCancelar");
const btnReiniciar = document.getElementById("btnReiniciar");
const btnJugarDeNuevo = document.getElementById("btnJugarDeNuevo");
const btnVolverConfig = document.getElementById("btnVolverConfig");
const canvasGL = document.getElementById("canvas");
const canvasBitMap = document.getElementById("canvasBitMap");
const spanTurno = document.getElementById("spanTurno");

// ── Estado de configuración (persistido para poder reiniciar) ────────────────
let configActual = { modo: "PvP", filas: 15, columnas: 15 };

// ── Instancias vivas del juego ───────────────────────────────────────────────
let motor;

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers de UI
// ─────────────────────────────────────────────────────────────────────────────

function mostrarConfig() {
  uiConfig.style.display = "block";
  uiJuego.style.display = "none";
  panelResultado.classList.remove("visible");
}

function mostrarJuego() {
  uiConfig.style.display = "none";
  uiJuego.style.display = "flex";
  panelResultado.classList.remove("visible");
}

function mostrarResultado(numGanador) {
  if (numGanador === null) {
    textoResultado.textContent = "¡Empate!";
    panelResultado.classList.add("visible");
    return;
  }
  textoResultado.textContent = `¡Jugador ${numGanador} ha ganado!`;
  panelResultado.classList.add("visible");
}

function detenerMotor() {
  if (motor) {
    motor.detener();
    motor = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Arranque
// ─────────────────────────────────────────────────────────────────────────────

btnStart.addEventListener("click", () => {
  const modo = document.getElementById("selectModo").value;
  const filas = parseInt(document.getElementById("inputFilas").value, 10);
  const columnas = parseInt(document.getElementById("inputCols").value, 10);

  if (filas < 5 || columnas < 5) {
    alert("El tablero debe ser de al menos 5×5");
    return;
  }

  configActual = { modo, filas, columnas };
  mostrarJuego();
  iniciarJuego(modo, filas, columnas);
});

// ── Botón Cancelar (mid-game) ─────────────────────────────────────────────────
btnCancelar.addEventListener("click", () => {
  detenerMotor();
  mostrarConfig();
});

// ── Botón Reiniciar (misma configuración) ─────────────────────────────────────
btnReiniciar.addEventListener("click", () => {
  detenerMotor();
  const { modo, filas, columnas } = configActual;
  mostrarJuego();
  iniciarJuego(modo, filas, columnas);
});

// ── Overlay de resultado: jugar de nuevo con la misma config ──────────────────
btnJugarDeNuevo.addEventListener("click", () => {
  detenerMotor();
  const { modo, filas, columnas } = configActual;
  mostrarJuego();
  iniciarJuego(modo, filas, columnas);
});

// ── Overlay de resultado: volver a configurar ─────────────────────────────────
btnVolverConfig.addEventListener("click", () => {
  detenerMotor();
  mostrarConfig();
});

// ── Evento de victoria disparado por SistemaJuegoAmoeba ───────────────────────
document.addEventListener("juegoTerminado", (e) => {
  console.log("[Amoeba] Juego terminado", e.detail);
  // El motor ya se detuvo por estado.juegoTerminado; mostramos el overlay.
  mostrarResultado(e.detail?.ganador ?? null);
});

// ─────────────────────────────────────────────────────────────────────────────
//  Core de inicialización
// ─────────────────────────────────────────────────────────────────────────────

function iniciarJuego(modo, filas, columnas) {
  console.log(`[Amoeba] Init: Modo=${modo} Grid=${filas}×${columnas}`);

  // Resetear UI de turno
  spanTurno.textContent = "Jugador 1 (Equis)";
  spanTurno.style.color = "#ff4757";

  // ── 1. WebGL y bitmap ──────────────────────────────────────────────────────
  const webgl = new ModeloWebGL(canvasGL, { colorFondo: "#a5a5b3" });
  const ctx2D = canvasBitMap.getContext("2d");

  // Rasterizar escena en 2D
  function rasterizarEscena2D(entidades) {
    //console.log(" rasterizarEscena2D", ctx2D.canvas.width, ctx2D.canvas.height);
    ctx2D.fillStyle = "#a5a5b3";
    ctx2D.fillRect(0, 0, ctx2D.canvas.width, ctx2D.canvas.height);
    let puntos = [];
    entidades.forEach((ent) => {
      if (ent.geometria?.figura?.draw2D) {
        const pts = ent.geometria.figura.draw2D(ctx2D);
        if (pts) puntos.push(...pts);
      }
    });
    return puntos;
  }

  // ── 2. ECS Escena ─────────────────────────────────────────────────────────
  const escena = new Escena();

  // ── 3. Entidad Manager (estado global del juego) ──────────────────────────
  const managerId = escena.crearEntidad("EstadoJuegoAmoeba");
  const estadoJuego = new EstadoJuegoComponent({
    modoJuego: modo,
  });
  escena.agregarComponente(managerId, estadoJuego);

  // ── 4. Grid visual (algoritmo DDA) ────────────────────────────────────────
  const factoryGrid = new GridFactory(escena, {
    filas,
    columnas,
    color: [0.25, 0.25, 0.38],
  });
  factoryGrid.conTransform(0, 0).conRender("puntos", 2, 0);
  factoryGrid.construir();

  // ── 5. Entidad cursor de hover ────────────────────────────────────────────
  // Cuadrado con relleno amarillo que sigue la celda bajo el ratón.
  const cursorHover = escena.crearEntidad("CursorHover");
  const gridDDA = escena.obtenerEntidadPorNombre("TableroAmoeba");
  const [anchoCelda, altoCelda] = gridDDA.geometria.figura.tamanoCelda;
  const cuadradoCursor = new Cuadrado(
    cursorHover.id,
    -anchoCelda / 2,
    -altoCelda / 2,
    anchoCelda / 2,
    altoCelda / 2,
    canvasGL,
    [1, 0.85, 0.1],
    "lineaDDA",
    true,
    "frontera",
    [0.1, 0.1, 0.1],
    ctx2D,
  );
  cuadradoCursor.render();
  escena.agregarComponente(cursorHover, new GeometriaComponent(cuadradoCursor));
  rasterizarEscena2D(escena.lista);
  escena.agregarComponente(cursorHover, new TransformComponent(0, 0, 0, 0, 1));
  escena.agregarComponente(cursorHover, new RenderComponent("puntos", 10, 5)); // orden 5 → sobre el grid
  cursorHover.transform.escala = 0; // invisible al inicio

  // ── 6. Sistemas ───────────────────────────────────────────────────────────
  const sistemaEntrada = new SistemaEntradaGrid(
    escena,
    canvasGL,
    filas,
    columnas,
    cursorHover.id,
  );
  const sistemaJuego = new SistemaJuegoAmoeba(escena);
  const sistemaAnim = new SistemaAnimacion(escena);
  const sistemaRender = new SistemaRender(webgl, escena);

  // Inyectar dependencias
  sistemaJuego.entrada = sistemaEntrada;
  sistemaJuego.estadoId = managerId.id;
  sistemaJuego.uiTurno = spanTurno;
  sistemaJuego.cursorId = cursorHover;

  escena.agregarSistema(sistemaEntrada); // 1. Input → hover NDC + clics
  escena.agregarSistema(sistemaJuego); // 2. Lógica: turnos, marcas, victoria
  escena.agregarSistema(sistemaAnim); // 3. Pop-in animación de marcas
  escena.agregarSistema(sistemaRender); // 4. Render final

  // ── 7. Motor ──────────────────────────────────────────────────────────────
  motor = new Motor();
  motor.agregarSistema(escena);
  motor.iniciar();

  console.log("[Amoeba] Motor iniciado. ¡A jugar!");
}
