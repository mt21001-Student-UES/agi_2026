/**
 * SistemaAnimacion
 * ----------------
 * Ejecuta las animaciones de efecto (pop-in) de las marcas X/O.
 * Corre ANTES que SistemaRender para que éste ya lea la escala actualizada.
 *
 * Por cada entidad con `animacionEfecto` (activa) + `transform`:
 *   - FASE entrada  : interpola escala 0→1 usando easing cuadrático (ease-out)
 *   - FASE rebote   : oscila ± reboteAmplitud durante reboteDuracion segundos
 *   - FASE completada: desactiva el componente (sin coste en frames siguientes)
 */
export default class SistemaAnimacion {
  constructor(escena) {
    this.escena = escena;
  }

  update(deltaTime) {
    const entidades = this.escena.consultarPorComponente('animacionEfecto');

    for (const entidad of entidades) {
      const anim = entidad.animacionEfecto;
      const tf   = entidad.transform;

      // Si no hay transform o la animación terminó, saltar
      if (!tf || !anim.activa) continue;

      // ── FASE: entrada ─────────────────────────────────────────────────────
      if (anim.fase === 'entrada') {
        anim.progreso += deltaTime / anim.duracion;

        if (anim.progreso >= 1) {
          anim.progreso = 1;
          anim.fase = 'rebote';
          anim.reboteTimer = 0;
        }

        // Easing ease-out cuadrático: t*(2-t) — crece rápido y frena suave
        const t = anim.progreso;
        const easedT = t * (2 - t);
        tf.escalaX = anim.escalaInicial + (anim.escalaFinalX - anim.escalaInicial) * easedT;
        tf.escalaY = anim.escalaInicial + (anim.escalaFinalY - anim.escalaInicial) * easedT;
        tf.dirty = true;
      }

      // ── FASE: rebote (intermitente) ───────────────────────────────────────
      else if (anim.fase === 'rebote') {
        anim.reboteTimer += deltaTime;

        if (anim.reboteTimer >= anim.reboteDuracion) {
          // Rebote terminado: fijar escala y desactivar
          tf.escalaX   = anim.escalaFinalX;
          tf.escalaY   = anim.escalaFinalY;
          tf.dirty    = true;
          anim.activa  = false;
          anim.fase    = 'completada';
        } else {
          // Oscilación sinusoidal que decae con el tiempo
          const decay = 1 - (anim.reboteTimer / anim.reboteDuracion);
          const freq  = 12; // Hz de la oscilación
          const onda  = Math.sin(anim.reboteTimer * freq * Math.PI * 2);
          tf.escalaX = anim.escalaFinalX + anim.reboteAmplitud * onda * decay;
          tf.escalaY = anim.escalaFinalY + anim.reboteAmplitud * onda * decay;
          tf.dirty = true;
        }
      }
    }
  }
}
