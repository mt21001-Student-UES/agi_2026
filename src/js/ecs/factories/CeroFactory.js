import EntidadFactory from "../EntidadFactory.js";
import GeometriaComponent from "../componentes/GeometriaComponent.js";
import { AnimacionEfectoComponent } from "../Componentes.js";
import LetraO from "../../graficos/figuras/letras/letraO.js";
import LetraO3D from "../../graficos/figuras/letras/LetraO3D.js";
import LetraO3DMat4 from "../../graficos/figuras/letras/LetraO3DMat4.js";

/**
 * CeroFactory
 * -----------
 * Marca O (jugador 2). Puede renderizarse plana (LetraO) o volumétrica (LetraO3D).
 *
 * Coordenadas: píxeles canvas. SistemaRender aplica la proyección NDC.
 *
 * @param {Object} opciones
 * @param {number} opciones.posicion     posicion para el transform de la entidad
 * @param {number} opciones.rotacion     rotacion para el transform de la entidad
 * @param {number} opciones.escalado     escalado para el transform de la entidad
 * @param {number[]} opciones.color      color de la marca [r,g,b]
 * @param {number} opciones.tamaño     tamaño de la marca
 * @param {boolean} opciones.volumen3D Si es true, usa LetraO3D.
 */
export default class CeroFactory extends EntidadFactory {
  constructor(escena, opciones = {}) {
    super(escena, "Cero");

    const defaults = {
      posicion: { x: 0, y: 0, z: 0 },
      rotacion: { x: 0, y: 0, z: 0 },
      escalado: { x: 1, y: 1, z: 1 },
      tamaño: 20,
      color: [0, 0, 1],
      volumen3D: false,
    };

    const opts = { ...defaults, ...opciones };
    //console.log("Cero opts", opts);

    let figuraCero;
    if (opts.volumen3D) {
      if (opts.mat4) {
        figuraCero = new LetraO3DMat4(this.entidad.id, {
          color: opts.color,
          tamaño: opts.tamaño,
          grosor: opts.grosor,
          altura3D: opts.altura3D,
          colorCaraSup: opts.colorCaraSup,
          colorCaraInf: opts.colorCaraInf,
          rellenarCaras: opts.rellenarCaras,
        });
      } else {
        figuraCero = new LetraO3D(this.entidad.id, {
          color: opts.color,
          tamaño: opts.tamaño,
          grosor: opts.grosor,
          altura3D: opts.altura3D,
          colorCaraSup: opts.colorCaraSup,
          colorCaraInf: opts.colorCaraInf,
        });
      }
    } else {
      figuraCero = new LetraO(this.entidad.id, opts.posicion, {
        color: opts.color,
        tamaño: opts.tamaño,
        algoritmoLinea: "bresenham",
      });
    }
    this.escena.agregarComponente(
      this.entidad,
      new GeometriaComponent(figuraCero),
    );

    // Animación pop-in
    this.escena.agregarComponente(this.entidad, new AnimacionEfectoComponent());

    // Posición en píxeles canvas; escala 0 para el pop-in
    this.conTransform({
      posicion: opts.posicion,
      rotacion: opts.rotacion,
      escalado: opts.escalado,
      modo3D: opts.mat4 === true,
    });
    this.conRender(opts.mat4 ? "puntos3d" : "puntos", 3, 10);
  }
}
