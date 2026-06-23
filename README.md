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

- **Instanciación Única de Sistemas**: Los sistemas (`SistemaRender`, `SistemaJuegoAmoeba`, etc.) **no** se instancian por cada entidad. Se instancian **una sola vez a nivel de escena** (en `5_en_raya.js`) y se agregan a la `Escena`. Luego, el `Motor.js` llama a `escena.update(dt)` en cada frame, lo que a su vez ejecuta el `.update(dt)` de cada sistema exactamente una vez por frame. Cada sistema se encarga internamente de consultar la escena (`this.escena.consultarPorComponente(...)`) para iterar sobre todas las entidades que le interesan.
- **Geometría Compuesta (Patrón "Matrioska")**: Una figura puede estar compuesta de otras figuras. Por ejemplo, `GeometriaComponent` recibe una instancia base, como `LetraX`. `LetraX` (que hereda de `LetraInterface`) contiene internamente un arreglo `this.partes` donde guarda dos figuras `Linea`. Al llamar a `render()` sobre `LetraX`, esta itera sobre sus `partes`, ejecuta el `render()` de cada `Linea` interna y concatena los puntos resultantes en un único `Float32Array`. Esto mantiene el patrón legado donde una geometría compleja se construye ensamblando geometrías más simples.
- **Figuras como datos puros en el GPU**: Todas las figuras (LetraX, LetraO, GridDDA) se calculan en CPU con algoritmos de rasterización (DDA/Bresenham) y se entregan a WebGL como `Float32Array` vía `gl.POINTS`. Nunca se usan `gl.LINES` o `gl.TRIANGLES` para las primitivas del juego, salvo que las instrucciones lo permitan.
- **Escala como animación sin tocar el buffer**: La animación pop-in no recalcula los vértices de la figura. El buffer local de la figura es **estático** (marcado limpio tras el primer render). `SistemaRender` aplica `transform.escala` en la CPU al momento de dibujar, multiplicando cada vértice antes de mandarlo a la GPU.
- **Cursor de hover como entidad ECS**: El punto de hover no es un hack especial de render. Es una entidad normal con `GeometriaComponent` + `TransformComponent`. Cada frame `SistemaJuegoAmoeba` actualiza su `transform.x/y/escala` como con cualquier otra entidad, y `SistemaRender` la dibuja automáticamente.
- **Dirty flag en GeometriaComponent**: Las marcas X/O solo calculan su buffer una vez (cuando se crean). Los frames siguientes reutilizan el caché (`_sucio = false`), el único trabajo por frame es la multiplicación de la escala en `SistemaRender`.
- **Caché de Transformación en CPU (Dirty Flags)**: El motor evita recalcular transformaciones de vértices innecesariamente. `TransformComponent` usa `_dirty` para recalcular su matriz de modelo solo cuando su posición o escala cambian. `SistemaRender` guarda en caché el buffer final (ya multiplicado por la proyección NDC y modelo) y solo vuelve a iterar los vértices si la entidad se movió, la ventana cambió de tamaño, o la figura se modificó.

---

## Evolución a Parcial 3 (Fase 0 - Pago de Deuda Técnica)

Para poder soportar el juego en 3D del Parcial 3 de forma mantenible, se refactorizó el pipeline:
1. **Espacio de Píxeles Locales:** Los algoritmos Bresenham y DDA ya no calculan posiciones NDC directamente, ni requieren parámetros del canvas (`h, k`). Ahora generan siempre vértices en **píxeles centrados en (0,0)**.
2. **Pipeline Matricial `Mat3`:** El `SistemaRender` unificó el posicionamiento. Genera la proyección NDC (1 sola vez por frame) y la multiplica por la matriz del `TransformComponent` de cada entidad. Esto permite cualquier combinación de rotación/traslación/escala de manera nativa (T·R·S).
3. **Perspectiva Isométrica y Reactividad (Rotación + Escala):** Para dar el aspecto tridimensional al juego 3x3x3, los tableros reciben rotación de 45° (`Math.PI/4`) y achatamiento vertical (`escalaY = 0.5`) directamente en su `TransformComponent`. Esto es **completamente reactivo**: si se ajusta la orientación o rotación de un tablero en tiempo real, el motor visual se adapta sin cambiar el código de rasterización base.
4. **Raycasting Inverso para Interacción (Hover y Clics):** Modificar la perspectiva deforma las celdas (rombo en vez de cuadrado). Para detectar el ratón de forma precisa sin fórmulas matemáticas ad-hoc, se implementó el método `.inversa()` en la clase `Mat3`. El sistema de entrada toma las coordenadas del ratón (pantalla) y las multiplica por la matriz inversa del tablero, obteniendo las coordenadas locales "planas". Así la detección del *hover* es 100% reactiva a la orientación 3D. El cursor interactivo simplemente "copia" la matriz del tablero para dibujarse en la misma perspectiva.
5. **Preparación 3D:** El `CasillaComponent` fue modificado para incluir el parámetro `nivel`, habilitando tableros apilados en el eje Z.
6. **Relleno 3D y Figuras con Volumen (Novedad Parcial 3):** Para dotar a las fichas (X y O) de volumen isométrico, se descartó el uso de un canvas auxiliar 2D. En su lugar, se desarrollaron clases dedicadas (`LetraX3D` y `LetraO3D`) que operan nativamente con los algoritmos del motor:
    - **Cálculo de Aristas:** Se genera una matriz en memoria (`Uint8Array`) y se trazan los contornos de las figuras utilizando **DDA** (para las líneas de la X) y **Bresenham** (para los círculos concéntricos de la O).
    - **Relleno de Caras:** Se aplica un algoritmo de **Flood Fill clásico** directamente sobre esta matriz bidimensional para encontrar todos los píxeles interiores.
    - **Extrusión (Z-Stacking Falso):** Se simula el relieve isométrico duplicando los puntos rasterizados y desplazándolos un paso iterativo en el eje `Y` local (hacia arriba/abajo). Al aplicar la deformación isométrica del tablero, estos desplazamientos se proyectan en la pantalla como el relieve vertical del modelo tridimensional.
    - **Caché y Optimización:** El proceso de rasterización y extrusión sólo se ejecuta **una vez** por figura. El gran `Float32Array` resultante con miles de puntos se guarda estáticamente (`bufferCache`) y se recicla sin coste computacional cada vez que el Factory instancia una nueva marca.
    - *Opcional:* Se puede alternar entre las figuras planas 2D originales y los nuevos bloques volumétricos cambiando el parámetro `volumen3D: true/false` al instanciar `EquisFactory` y `CeroFactory`.

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

# Consideraciones Parcial 3

Se le pide crear una variante del juego equis cero, pero que funcione en 3D, es decir, que ahora puede ganar si forma 3 figuras en linea ya sea en 2d (mismo tablero) o 3d (en los tres tableros). El tablero debe ser multidimensional (3 niveles exactos) (10%) y las piezas deben generarse en perspectiva simulando relieves como en la imagen de referencia (10%) (la imagen fue generada mediante un modelo LLM, adjunto en la carpeta en img con el nombre 3_en_raya_3D.png).

Considere:
● La imagen de referencia no muestra todas las casillas, para facilitar la selección de casillas amplíe la distancia entre cada nivel para que se muestren los tableros completos. Resalte las casillas al mover el mouse sobre ellas y al ganar una partida genere una linea (en el mismo tablero o entre los tableros segun sea el caso) indicando la victoria.
● Puede usar únicamente algoritmos cubiertos en clase para generar las líneas o círculos (30%).
● Use cualquier algoritmo de relleno para llenar los relieves (30%)
● Como elementos de mecánica, además de la opción de dos jugadores, permita partidas de un solo jugador contra un motor creado para eso (10%). Finalmente, cree la opción “demo”, donde el motor que creó juegue contra sí mismo (10%)

---

## Implementación de Soluciones (Parcial 3)

A continuación, se detalla cómo se resolvieron cada uno de los requerimientos utilizando la arquitectura ECS y los algoritmos básicos permitidos:

### 1. Tablero Multidimensional y Perspectiva (Mat4 + WebGL)
Para migrar el juego a 3D manteniendo el rendimiento, se introdujo un pipeline híbrido en el `SistemaRender`. 
* El componente `TransformComponent` ahora soporta `modo3D: true`, generando internamente una matriz 4x4 (`Mat4`) que incluye traslación y rotación pura en el eje Z. 
* Los tableros (`GridDDA`) se inclinan utilizando esta matriz para lograr la perspectiva isométrica falsa de apilamiento en 3 niveles, sin tener que modificar los algoritmos de dibujo base.

### 2. Detección de Hover y Clics (Raycasting Reactivo)
Se logró interactuar con los tableros inclinados sin depender de colisionadores complejos.
* El `SistemaEntrada3D` toma las coordenadas del ratón (NDCs) y las multiplica por la **matriz inversa** (`Mat3.inversa()`) de la transformación del tablero. 
* Esto convierte mágicamente la posición del cursor en pantalla a las coordenadas locales "planas" 2D del tablero, permitiendo saber en qué celda exacta se hizo clic, indiferentemente de cuán deformado, escalado o rotado esté el tablero.

### 3. Figuras con Relieve (Bresenham + Flood Fill + Z-Stacking)
Se diseñaron figuras volumétricas (`LetraX3D`, `LetraO3D`) utilizando los algoritmos permitidos:
* Se crean *caras planas* dibujando sus bordes con DDA/Bresenham en una matriz bidimensional auxiliar (un `Uint8Array`).
* Para *rellenar* el interior de esas caras, se utiliza el clásico algoritmo de **Flood Fill**.
* El volumen se obtiene "extruyendo" los puntos rasterizados iterativamente a través del eje Z o desplazándolos isométricamente (Z-Stacking). Para que esto sea performante, todo el bloque se guarda en caché dentro de la CPU al inicio y se procesa mediante WebGL con primitivas `gl.POINTS`.

### 4. Línea de Victoria 3D y Control de Grosor Perpendicular
Dibujar una línea 2D plana para conectar 3 piezas volumétricas en el espacio generaba un problema de perspectiva: al ver la línea "de canto" o de frente, el grosor de la línea desaparecía.
* Se resolvió implementando un avanzado **Cálculo de Ángulos de Euler (`rotX`, `rotY`, `rotZ`)**. La línea se rota matemáticamente para que no solo apunte del Centro A al Centro B tridimensionalmente, sino que su vector "normal" (el que dictamina su grosor visual) sea forzado a alinearse siempre **paralelo a la pantalla**. 
* Esto asegura que el jugador observe un grosor consistente de línea de victoria incluso entre perspectivas muy inclinadas e independientemente si conecta piezas en un mismo nivel o piezas cruzando todos los tableros.

### 5. Motor de IA (Single Player y Demo)
Se integró el `SistemaJuego3D` capaz de correr una máquina de estados independiente que intercala turnos entre Humano vs IA o IA vs IA.
* La IA usa una heurística sencilla pero efectiva que: **1)** Busca un movimiento ganador, **2)** Bloquea el movimiento ganador del oponente, **3)** Juega posiciones estratégicas y **4)** Juega aleatorio como recurso de respaldo.
* Todos los movimientos de la IA y el jugador mantienen su correcto flujo de renderizado y sincronización de turnos en la UI.
