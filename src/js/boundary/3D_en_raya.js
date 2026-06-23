import Motor from "../core/Motor.js";
import Escena from "../core/Escena.js";
import ModeloWebGL from "../graficos/ModeloWebGL.js";
import SistemaRender from "../sistemas/SistemaRender.js";
import SistemaAnimacion from "../sistemas/SistemaAnimacion.js";
import {
  EstadoJuegoComponent,
  TransformComponent,
  RenderComponent,
} from "../ecs/Componentes.js";
import GeometriaComponent from "../ecs/componentes/GeometriaComponent.js";
import Cuadrado from "../graficos/figuras/Cuadrado.js";

// Importaremos los nuevos sistemas y fábricas 3D que crearemos
import Tablero3DFactory from "../ecs/factories/Tablero3DFactory.js";
import SistemaEntrada3D from "../sistemas/SistemaEntrada3D.js";
import SistemaJuego3D from "../sistemas/SistemaJuego3D.js";

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
const canvas = document.getElementById("canvas");
const spanTurno = document.getElementById("spanTurno");

// ── Estado de configuración ──────────────────────────────────────────────────
let configActual = { modo: "PvP", filas: 3, columnas: 3 }; // El 3D suele ser 3x3x3
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
  textoResultado.textContent =
    numGanador === null ? "¡Empate!" : `¡Jugador ${numGanador} ha ganado!`;
  panelResultado.classList.add("visible");
}

function detenerMotor() {
  if (motor) {
    motor.detener();
    motor = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Eventos de UI
// ─────────────────────────────────────────────────────────────────────────────

btnStart.addEventListener("click", () => {
  const modo = document.getElementById("selectModo").value;
  // Para el 3 en raya 3D, forzaremos 3x3x3
  const filas = 3;
  const columnas = 3;

  configActual = { modo, filas, columnas };
  mostrarJuego();
  iniciarJuego(modo, filas, columnas);
});

btnCancelar.addEventListener("click", () => {
  detenerMotor();
  mostrarConfig();
});

btnReiniciar.addEventListener("click", () => {
  detenerMotor();
  const { modo, filas, columnas } = configActual;
  mostrarJuego();
  iniciarJuego(modo, filas, columnas);
});

btnJugarDeNuevo.addEventListener("click", () => {
  detenerMotor();
  const { modo, filas, columnas } = configActual;
  mostrarJuego();
  iniciarJuego(modo, filas, columnas);
});

btnVolverConfig.addEventListener("click", () => {
  detenerMotor();
  mostrarConfig();
});

document.addEventListener("juegoTerminado", (e) => {
  mostrarResultado(e.detail?.ganador ?? null);
  detenerMotor();
});

// ─────────────────────────────────────────────────────────────────────────────
//  Core de inicialización del Juego 3D
// ─────────────────────────────────────────────────────────────────────────────

function iniciarJuego(modo, filas, columnas) {
  console.log(
    `[3D en Raya] Init: Modo=${modo} Grid=${filas}x${columnas}x3 niveles`,
  );

  spanTurno.textContent = "Jugador 1 (Equis)";
  spanTurno.style.color = "#ff4757";

  // 1. WebGL
  const webgl = new ModeloWebGL(canvas, { colorFondo: "#1e1e1e" });
  const W = canvas.width;
  const H = canvas.height;

  // Parámetros para los 3 tableros
  // Como es 3D y aplicaremos shear/offset, los tableros serán más pequeños para caber
  const anchoPx = W * 0.4;
  const altoPx = H * 0.4;

  // 2. Escena ECS
  const escena = new Escena();

  // 3. Manager
  const managerId = escena.crearEntidad("EstadoJuego3D");
  escena.agregarComponente(
    managerId,
    new EstadoJuegoComponent({
      modoJuego: modo,
    }),
  );

  // 4. Tablero 3D (Genera los 3 niveles)
  const factoryTablero3D = new Tablero3DFactory(escena, {
    filas,
    columnas,
    anchoPx,
    altoPx,
    // Offsets de perspectiva isométrica falsa (desplazamiento en X e Y por nivel)
    // Nivel 0 (Fondo), Nivel 1 (Medio), Nivel 2 (Frente)
    offsetNivel: { x: 0, y: -H * 0.3 },
    opcionesTransformacion: {
      posicion: { x: W / 2, y: H / 2 + H * 0.3, z: 0.5 },
      rotacion: { x: -Math.acos(0.5), y: 0, z: Math.PI / 4 }, // X negativo para que la parte superior quede más profunda en Z
      escalado: { x: 1, y: 1, z: 1 },
      mat4: true,
    },
  });
  factoryTablero3D.construir();

  // 5. Cursor Hover 3D (serán 3 cursores o 1 que salta entre niveles)
  const cursorHover = escena.crearEntidad("CursorHover3D");
  //const ctx2D = canvas.getContext("2d"); // Para compatibilidad de Cuadrado, aunque en 3D lo dibujamos directo o ignoramos relleno

  const anchoCelda = anchoPx / columnas;
  const altoCelda = altoPx / filas;

  const cuadradoCursor = new Cuadrado(
    cursorHover.id,
    (-anchoCelda / 2) * 0.9,
    (-altoCelda / 2) * 0.9,
    (anchoCelda / 2) * 0.9,
    (altoCelda / 2) * 0.9,
    canvas,
    [1, 0.85, 0.1], // Amarillo
    "lineaDDA",
    true,
    "frontera",
    [0.1, 0.1, 0.1],
  );
  escena.agregarComponente(cursorHover, new GeometriaComponent(cuadradoCursor));
  escena.agregarComponente(cursorHover, new TransformComponent());
  escena.agregarComponente(cursorHover, new RenderComponent("puntos", 2, 10, false)); // orden 10 = siempre arriba, visible

  // 6. Sistemas
  const sistemaEntrada = new SistemaEntrada3D(
    escena,
    canvas,
    filas,
    columnas,
    3, // 3 niveles
    factoryTablero3D.obtenerNiveles(),
    cursorHover.id,
  );

  const sistemaJuego = new SistemaJuego3D(escena);
  const sistemaAnim = new SistemaAnimacion(escena);
  const sistemaRender = new SistemaRender(webgl, escena);

  // Inyectar dependencias en SistemaJuego3D
  sistemaJuego.entrada = sistemaEntrada;
  sistemaJuego.estadoId = managerId.id;
  sistemaJuego.uiTurno = spanTurno;

  // Inyectar datos de perspectiva para generar las marcas en el lugar correcto
  sistemaJuego.anchoCelda = anchoPx / columnas;
  sistemaJuego.altoCelda = altoPx / filas;
  sistemaJuego.config3D = factoryTablero3D.obtenerConfig();
  sistemaJuego.idsNiveles = factoryTablero3D.obtenerNiveles();

  sistemaEntrada.config3D = factoryTablero3D.obtenerConfig();

  escena.agregarSistema(sistemaEntrada);
  escena.agregarSistema(sistemaJuego);
  escena.agregarSistema(sistemaAnim);
  escena.agregarSistema(sistemaRender);

  // 7. Motor
  motor = new Motor();
  motor.agregarSistema(escena);
  motor.iniciar();

  console.log("[3D en Raya] Motor iniciado.");
}
