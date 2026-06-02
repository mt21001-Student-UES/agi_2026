# Guía de Arquitectura del Motor WebGL (ECS) - Estado del Proyecto

Este documento detalla la arquitectura actual del motor gráfico, basado en el patrón **ECS (Entity-Component-System)**. Inicialmente, la aplicación era un renderizador de puntos básico; actualmente se encuentra en transición hacia un motor interactivo escalable y mantenible.

## Visión General (Arquitectura ECS)

La filosofía principal del motor es la **Separación Estricta**:

- **Datos** por un lado (Componentes).
- **Lógica** por otro lado (Sistemas).
- **Entidades** que actúan como identificadores o contenedores de componentes.

### Estructura de Directorios Actual

```text
src/js/
├── core/
│   ├── Motor.js            # Game Loop (requestAnimationFrame + deltaTime)
│   └── Escena.js           # Contenedor de entidades y orquestador de sistemas
├── ecs/
│   ├── Componentes.js      # Barrel: re-exporta todos los componentes
│   ├── EntidadFactory.js   # Builder base (fluent API)
│   ├── componentes/
│   │   ├── TransformComponent.js      # Posición (x,y,z), rotación, escala
│   │   ├── FisicaComponent.js         # velocidadX/Y, peso
│   │   ├── GeometriaComponent.js      # Wrapper de FiguraInterface + dirty flag
│   │   ├── RenderComponent.js         # modo, tamañoPunto, orden, visible
│   │   ├── CasillaComponent.js        # fila, columna, estado (vacia/equis/cero), hover
│   │   ├── EstadoJuegoComponent.js    # turnoActual, modoJuego, juegoTerminado, ganador
│   │   └── AnimacionEfectoComponent.js # progreso, duracion, fases (entrada/rebote/completada)
│   └── factories/
│       ├── CirculoFactory.js  # Entidad círculo rasterizado (octantes Bresenham)
│       ├── GridFactory.js     # Tablero (GridDDA) + matriz de CasillaComponent
│       ├── EquisFactory.js    # Marca X usando LetraX (Bresenham)
│       └── CeroFactory.js     # Marca O usando LetraO (círculo Bresenham)
├── sistemas/
│   ├── SistemaEntradaGrid.js  # Ratón → fila/col, hover NDC, clic registrado
│   ├── SistemaJuegoAmoeba.js  # Máquina de estados del juego (turnos, crea marcas)
│   ├── SistemaAnimacion.js    # Pop-in con ease-out + rebote sinusoidal (escala en TransformComponent)
│   ├── SistemaRender.js       # Agrupa buffers por shader, aplica transform (escala + traslación)
│   ├── SistemaFisicas.js      # (Genérico, no usado en Amoeba aún)
│   └── SistemaInput.js        # (Genérico, teclado/mouse global)
├── graficos/
│   ├── ModeloWebGL.js         # Multi-shader, DYNAMIC_DRAW, iniciarFrame(), dibujarPuntos()
│   ├── algoritmos/
│   │   ├── lineaBresenham.js
│   │   └── lineaDDA.js
│   └── figuras/
│       ├── figuraInterface.js  # Clase abstracta base
│       ├── GridDDA.js          # Grid usando líneas DDA
│       ├── Linea.js            # Línea (DDA o Bresenham)
│       ├── Circulo.js          # Círculo por octantes
│       ├── Puntos.js           # Buffer de puntos arbitrario
│       └── letras/
│           ├── letraInterface.js
│           ├── letraX.js       # Dos líneas Bresenham cruzadas
│           └── letraO.js       # Círculo Bresenham
└── boundary/
    └── 5_en_raya.js            # Punto de entrada del juego Amoeba
```

---

## Juego Amoeba (5 en Raya) — Estado Actual

### Implementado

| Característica                                             | Archivo                                            |
| ---------------------------------------------------------- | -------------------------------------------------- |
| Pantalla de configuración (modo, filas, columnas mín. 5×5) | `src/html/views/5_en_raya.html`                    |
| Motor no arranca hasta pulsar "Iniciar Partida"            | `src/js/boundary/5_en_raya.js`                     |
| Tablero dibujado con algoritmo DDA                         | `src/js/graficos/figuras/GridDDA.js`               |
| Casillas lógicas (CasillaComponent por cada celda)         | `src/js/ecs/factories/GridFactory.js`              |
| Detección de hover (mouse → fila/col → NDC)                | `src/js/sistemas/SistemaEntradaGrid.js`            |
| Relleno de celda en hover                                  | `src/js/graficos/algoritmos/rellenoPorFrontera.js` |
| Clic registra jugada y alterna turnos                      | `src/js/sistemas/SistemaJuegoAmoeba.js`            |
| Marca X creada con LetraX (líneas Bresenham)               | `src/js/ecs/factories/EquisFactory.js`             |
| Marca O creada con LetraO (círculo Bresenham)              | `src/js/ecs/factories/CeroFactory.js`              |
| Animación pop-in (ease-out) + rebote sinusoidal            | `src/js/sistemas/SistemaAnimacion.js`              |
| SistemaRender aplica escala + traslación del Transform     | `src/js/sistemas/SistemaRender.js`                 |
| Estado de turno actualizado en UI HTML                     | `src/js/sistemas/SistemaJuegoAmoeba.js`            |
| Casilla bloqueada al ser marcada (no se puede re-clickear) | `src/js/sistemas/SistemaJuegoAmoeba.js`            |
| Pantall de fin de juego (Victoria o empate)                | `src/js/sistemas/SistemaJuegoAmoeba.js`            |
| Modo contra la IA y el modo demo                           | `src/js/sistemas/SistemaJuegoAmoeba.js`            |

---

## Flujo Completo por Frame (Pipeline de Ejecución)

```
requestAnimationFrame (Motor.js)
         │
         ▼
   Escena.update(dt)
         │
         ├─ 1. SistemaEntradaGrid.update(dt)
         │       • Eventos asíncronos del DOM ya actualizaron:
         │           ├─ casillaHoverGrid  { fila, col }
         │           ├─ casillaHoverNDC   { x_ndc, y_ndc }
         │           └─ ultimaCeldaClickeada { fila, col }
         │       • Todos los CasillaComponent.hover actualizados
         │
         ├─ 2. SistemaJuegoAmoeba.update(dt)
         │       ├─ Mueve transform del cursor de hover a casillaHoverNDC
         │       │       └─ cursor.transform.x/y = entrada.casillaHoverNDC.x/y
         │       │          cursor.transform.escala = 1 (visible) o 0 (oculto)
         │       └─ Si hay ultimaCeldaClickeada:
         │               ├─ Busca la CasillaComponent de esa celda
         │               ├─ Si está vacía:
         │               │     ├─ casilla.estado = 'equis' | 'cero'
         │               │     ├─ Calcula x_ndc, y_ndc del centro de la celda
         │               │     ├─ Instancia EquisFactory o CeroFactory
         │               │     │     └─ Crea entidad con GeometriaComponent + AnimacionEfectoComponent
         │               │     │         → TransformComponent.escala empieza en 0
         │               │     ├─ Alterna turnoActual (jugador1 ↔ jugador2)
         │               │     └─ Actualiza spanTurno en el HTML
         │               └─ Si está ocupada: ignora y muestra warn en consola
         │
         ├─ 3. SistemaAnimacion.update(dt)
         │       • Para cada entidad con AnimacionEfectoComponent activo:
         │           ├─ FASE entrada: progreso += dt/duracion
         │           │     escala = ease-out(progreso) → TransformComponent.escala
         │           ├─ FASE rebote: oscila sinusoidalmente ± reboteAmplitud * decay
         │           └─ FASE completada: escala = 1, animacionEfecto.activa = false
         │
         └─ 4. SistemaRender.update(dt)
                 • modeloWebGL.iniciarFrame()  ← limpia canvas con color de fondo
                 • Consulta entidades con 'geometria' y ordena por render.orden
                 • Por cada entidad visible:
                 │     geom.obtenerBuffer()  ← llama figura.render() solo si está sucio
                 │     #aplicarTransform(buffer, transform)
                 │         → x_final = x_local * transform.escala + transform.x
                 │         → y_final = y_local * transform.escala + transform.y
                 └─ Agrupa por modo shader → modeloWebGL.dibujarPuntos(data, tamaño)
```

---

## Flujo de Instanciación (Una Sola Vez al Iniciar)

```
Usuario llena formulario y pulsa "Iniciar Partida"
    └─ boundary/5_en_raya.js :: iniciarJuego(modo, filas, columnas)
           │
           ├─ new ModeloWebGL(canvas)           → contexto WebGL, shaders compilados
           ├─ new Escena()                       → mapa de entidades vacío
           │
           ├─ escena.crearEntidad('Manager')
           │       └─ agregarComponente → EstadoJuegoComponent
           │               { turnoActual: 'jugador1', modoJuego, juegoTerminado: false }
           │
           ├─ new GridFactory(escena, {filas, columnas})
           │       ├─ new GridDDA(...)            → figura que une (filas+1)+(cols+1) Lineas DDA
           │       ├─ GeometriaComponent(gridDDA) → wrappea la figura con dirty flag
           │       ├─ TransformComponent(0,0,0)
           │       ├─ RenderComponent('puntos', 2, orden=0)
           │       └─ crea filas×columnas entidades 'Casilla_f_c'
           │               cada una con CasillaComponent(f, c)
           │
           ├─ escena.crearEntidad('CursorHover')
           │       ├─ GeometriaComponent(Puntos → un punto amarillo en origen)
           │       ├─ TransformComponent(0,0,0, escala=0)  ← invisible al inicio
           │       └─ RenderComponent('puntos', 10, orden=5)  ← dibujado sobre el grid
           │
           ├─ new SistemaEntradaGrid(...)   → vincula mousemove/click/mouseleave al canvas
           ├─ new SistemaJuegoAmoeba(...)   → inyectar .entrada, .estadoId, .uiTurno, .cursorId
           ├─ new SistemaAnimacion(...)
           ├─ new SistemaRender(webgl, escena)
           │
           ├─ escena.agregarSistema(×4)     → lista ordenada de sistemas
           └─ motor.iniciar()               → requestAnimationFrame en bucle infinito
```

---

## Decisiones de Diseño Clave

- **Figuras como datos puros en el GPU**: Todas las figuras (LetraX, LetraO, GridDDA) se calculan en CPU con algoritmos de rasterización (DDA/Bresenham) y se entregan a WebGL como `Float32Array` vía `gl.POINTS`. Nunca se usan `gl.LINES` o `gl.TRIANGLES` para las primitivas del juego, salvo que las instrucciones lo permitan.
- **Escala como animación sin tocar el buffer**: La animación pop-in no recalcula los vértices de la figura. El buffer local de la figura es **estático** (marcado limpio tras el primer render). `SistemaRender` aplica `transform.escala` en la CPU al momento de dibujar, multiplicando cada vértice antes de mandarlo a la GPU.
- **Cursor de hover como entidad ECS**: El punto de hover no es un hack especial de render. Es una entidad normal con `GeometriaComponent` + `TransformComponent`. Cada frame `SistemaJuegoAmoeba` actualiza su `transform.x/y/escala` como con cualquier otra entidad, y `SistemaRender` la dibuja automáticamente.
- **Dirty flag en GeometriaComponent**: Las marcas X/O solo calculan su buffer una vez (cuando se crean). Los frames siguientes reutilizan el caché (`_sucio = false`), el único trabajo por frame es la multiplicación de la escala en `SistemaRender`.

---

## Consideraciones del Parcial 2

- **DDA (20%)**: Implementado en `GridDDA.js` para todas las líneas del tablero.
- **Bresenham para X (20%)**: Implementado vía `LetraX → Linea(algoritmo='Bresenham')`.
- **Bresenham para O (40%)**: Implementado vía `LetraO → Circulo` (octantes Bresenham).
- **Animación de aparición**: Implementada como escalado 0→1 con rebote elástico.
- **Motor IA PvE (10%)**: Implementado en `SistemaJuegoAmoeba`.
- **Demo EvE (10%)**: Implementado en `SistemaJuegoAmoeba`.
- **Relleno de celdas (hover)**: Implementado en `algoritmos/rellenoPorFrontera`.

---
