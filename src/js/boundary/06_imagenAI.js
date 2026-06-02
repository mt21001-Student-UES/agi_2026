import EscenaService from "../control/Escena.js";
import EtiquetasService from "../control/EtiquetasService.js";
import ModeloWebGL from "../control/modeloWebGL.js";
import { esFormatoValidoImg } from "../utils/validarFormatos.js";

// --- Inicialización ---
const canvas = document.getElementById("canvas");
const modelo = new ModeloWebGL(canvas);
const escena = new EscenaService();

// Crear el custom element
const etiquetaService = document.createElement("etiqueta-service");

// Insertarlo en el DOM (por ejemplo en un div contenedor)
document.getElementById("controls").appendChild(etiquetaService);

// Inicializar instancia
etiquetaService.inicializar(escena, modelo, canvas);