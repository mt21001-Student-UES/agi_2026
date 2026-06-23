import EntidadFactory from "../EntidadFactory.js";
import GridFactory from "./GridFactory.js";

/**
 * Tablero3DFactory
 * ----------------
 * Genera 3 niveles de tableros (GridDDA) desplazados para simular
 * profundidad isométrica. Reutiliza GridFactory para cada nivel.
 *
 * NOTA: Se agrega un “contenedor” entidad (Tablero3D_Contenedor) para mantener
 * juntos los tres niveles y que el SistemaGrid3D pueda gestionar el tablero
 * como una sola unidad (en particular para el cursor 3D).
 *
 * @param {Object} opciones
 * @param {number} opciones.filas      Número de filas del tablero.
 * @param {number} opciones.columnas   Número de columnas del tablero.
 * @param {number} opciones.anchoPx    Ancho en píxeles de la caja del tablero.
 * @param {number} opciones.altoPx     Alto en píxeles de la caja del tablero.
 * @param {number} opciones.cantidadNiveles Cantidad de niveles a crear.
 * @param {Object} opciones.offsetNivel  Desplazamiento {x, y} entre niveles consecutivos.
 * @param {Object} opciones.opcionesTransformacion Opciones para el TransformComponent:
 *   @param {Object} opciones.opcionesTransformacion.posicion Posición {x, y, z}.
 *   @param {Object} opciones.opcionesTransformacion.rotacion Rotación {x, y, z}.
 *   @param {Object} opciones.opcionesTransformacion.escalado Escala {x, y, z}.
 */
export default class Tablero3DFactory extends EntidadFactory {
  constructor(escena, opciones = {}) {
    super(escena, "Tablero3D_Contenedor");

    const defaults = {
      filas: 3,
      columnas: 3,
      anchoPx: 200,
      altoPx: 200,
      cantidadNiveles: 3,
      offsetNivel: { x: 60, y: -60 },
      opcionesTransformacion: {
        posicion: { x: 0, y: 0, z: 0 },
        rotacion: { x: 0, y: 0, z: 0 },
        escalado: { x: 1, y: 1, z: 1 },
      },
    };

    this.config = { ...defaults, ...opciones };

    this.niveles = [];

    // Generar 3 niveles (z=0, z=1, z=2)
    for (let nivel = 0; nivel < 3; nivel++) {
      // Color progresivo para dar sensación de profundidad
      /*const color = nivel === 0 ? [0.2, 0.2, 0.3] :
                    nivel === 1 ? [0.4, 0.4, 0.5] :
                                  [0.6, 0.6, 0.8];*/
      const color =
        nivel === 0 ? [1, 0, 0] : nivel === 1 ? [0, 1, 0] : [0, 0, 1];

      const grid = new GridFactory(escena, {
        filas: this.config.filas,
        columnas: this.config.columnas,
        anchoPx: this.config.anchoPx,
        altoPx: this.config.altoPx,
        color,
        nivel, // Para que los CasillaComponent tengan el nivel correcto
      });

      // Calcular la posición desplazada para este nivel
      const px =
        this.config.opcionesTransformacion.posicion.x +
        nivel * this.config.offsetNivel.x;
      const py =
        this.config.opcionesTransformacion.posicion.y +
        nivel * this.config.offsetNivel.y;

      // Usar TransformComponent para posicionar el nivel entero
      // Vista isométrica con rotación 3D pura: rotZ = 45°, rotX = 60°
      grid.conTransform({
        posicion: { x: px, y: py, z: 0 },
        rotacion: this.config.opcionesTransformacion.rotacion,
        escalado: { x: 1, y: 1, z: 1 },
        modo3D: this.config.opcionesTransformacion.mat4 === true,
      });

      const modoRender = this.config.opcionesTransformacion.mat4 ? "puntos3d" : "puntos";
      grid.conRender(modoRender, 2, nivel);
      grid.construir();
      this.niveles.push(grid.entidad.id);
    }
  }

  obtenerConfig() {
    return this.config;
  }

  obtenerNiveles() {
    return this.niveles;
  }
}
