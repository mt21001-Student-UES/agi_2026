import EntidadFactory from "../EntidadFactory.js";
import GeometriaComponent from "../componentes/GeometriaComponent.js";
import { AnimacionEfectoComponent } from "../Componentes.js";
import LetraX from "../../graficos/figuras/letras/letraX.js";
import LetraX3D from "../../graficos/figuras/letras/LetraX3D.js";
import LetraX3DMat4 from "../../graficos/figuras/letras/LetraX3DMat4.js";

/**
 * EquisFactory
 * ------------
 * Marca X (jugador 1). Puede renderizarse plana (Bresenham) o volumétrica (Z-Stacking).
 *
 * Coordenadas: píxeles canvas locales. SistemaRender aplica Mat3 y proyección NDC.
 *
 * @param {Object} opciones
 * @param {number} opciones.posicion     posicion para el transform de la entidad
 * @param {number} opciones.rotacion     rotacion para el transform de la entidad
 * @param {number} opciones.escalado     escalado para el transform de la entidad
 * @param {number[]} opciones.color      color de la marca [r,g,b]
 * @param {number} opciones.tamaño     tamaño de la marca
 * @param {number} opciones.grosor     grosor de la marca
 * @param {number} opciones.altura3D     altura de la marca
 * @param {number[]} opciones.colorCaraSup   color de la cara superior [r,g,b]
 * @param {number[]} opciones.colorCaraInf   color de la cara inferior [r,g,b]
 * @param {boolean} opciones.volumen3D Si es true, usa LetraX3D.
 */
export default class EquisFactory extends EntidadFactory {
  constructor(escena, opciones = {}) {
    super(escena, "Equis");

    let figuraEquis;
    if (opciones.volumen3D) {
      if(opciones.mat4){
        figuraEquis = new LetraX3DMat4(this.entidad.id, opciones);
      }else{
        figuraEquis = new LetraX3D(this.entidad.id, opciones);
      }
    } else {
      figuraEquis = new LetraX(this.entidad.id, opciones.posicion, opciones);
    }

    this.escena.agregarComponente(
      this.entidad,
      new GeometriaComponent(figuraEquis),
    );

    // Animación pop-in (escala 0→1 en SistemaAnimacion)
    this.escena.agregarComponente(this.entidad, new AnimacionEfectoComponent());

    // Posición en píxeles canvas; escala inicia en 0 (invisible) para el pop-in
    this.conTransform({
      posicion: opciones.posicion ?? { x: 0, y: 0, z: 0 },
      rotacion: opciones.rotacion ?? { x: 0, y: 0, z: 0 },
      escalado: opciones.escalado ?? { x: 1, y: 1, z: 1 },
      modo3D: opciones.mat4 === true,
    });
    this.conRender(opciones.mat4 ? "puntos3d" : "puntos", 3, 10);
  }
}
