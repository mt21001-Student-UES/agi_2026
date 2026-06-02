/**
 * Algoritmo de relleno por frontera
 * @param {CanvasRenderingContext2D} ctx2D - contexto 2D auxiliar
 * @param {number} nx - coordenada inicial normalizada o en pixeles
 * @param {number} ny - coordenada inicial normalizada o en pixeles
 * @param {Array<number>} colorRelleno - [r,g,b,a] del color de relleno
 * @param {Array<number>} colorFrontera - [r,g,b,a] del color de frontera
 * @param {boolean} normalizadas - si las coordenadas son normales
 * @returns {Array<number>} puntos normalizados listos para buffer WebGL
 */
export default function rellenoPorFrontera(
  ctx2D,
  nx,
  ny,
  colorRelleno,
  colorFrontera = [0, 0, 0, 255],
  normalizadas = true,
) {
  const imageData = ctx2D.getImageData(
    0,
    0,
    ctx2D.canvas.width,
    ctx2D.canvas.height,
  );
  const data = imageData.data;
  const puntos = [];
  const visitados = new Set();

  function getColor(px, py) {
    const idx = (py * ctx2D.canvas.width + px) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  }

  function setColor(px, py, color) {
    const idx = (py * ctx2D.canvas.width + px) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
    data[idx + 3] = color[3] ?? 255;
  }

  function coloresIguales(c1, c2, tol = 5) {
    return (
      Math.abs(c1[0] - c2[0]) < tol &&
      Math.abs(c1[1] - c2[1]) < tol &&
      Math.abs(c1[2] - c2[2]) < tol &&
      Math.abs(c1[3] - c2[3]) < tol
    );
  }

  function normalizar(px, py) {
    const nx = (px / ctx2D.canvas.width) * 2 - 1;
    const ny = 1 - (py / ctx2D.canvas.height) * 2;
    return [nx, ny];
  }

  function desnormalizar(nx, ny) {
    const px = Math.round(((nx + 1) / 2) * ctx2D.canvas.width);
    const py = Math.round(((1 - ny) / 2) * ctx2D.canvas.height);
    return [px, py];
  }

  let x, y;
  if (normalizadas) {
    [x, y] = desnormalizar(nx, ny);
  } else {
    x = nx;
    y = ny;
  }

  // Revisar que coordenadas estén dentro del canvas
  if (
    x < 0 ||
    y < 0 ||
    x >= ctx2D.canvas.width ||
    y >= ctx2D.canvas.height
  ) {
    console.error("Coordenadas fuera del canvas");
    return [];
  }

  const stack = [[x, y]];

  //console.log("stack", stack);
  //console.log("x", x);
  //console.log("y", y);

  let i = 0;
  const maxIter = ctx2D.canvas.width * ctx2D.canvas.height;

  while (stack.length > 0 && i < maxIter) {
    i++;
    //console.log("stack", stack);
    //console.log("i", i);

    const [cx, cy] = stack.pop();

    //console.log("cx", cx);
    //console.log("cy", cy);

    if (
      cx < 0 ||
      cy < 0 ||
      cx >= ctx2D.canvas.width ||
      cy >= ctx2D.canvas.height
    )
      continue;
    if (visitados.has(cx + "," + cy)) continue;
    visitados.add(cx + "," + cy);

    const actual = getColor(cx, cy);
    //console.log("actual", actual);
    //console.log("colorFrontera", colorFrontera);
    //console.log("colorRelleno", colorRelleno);
    if (
      !coloresIguales(actual, colorFrontera, 150) &&
      !coloresIguales(actual, colorRelleno, 150)
    ) {
      setColor(cx, cy, colorRelleno);
      const [nx, ny] = normalizar(cx, cy);
      puntos.push(nx, ny);

      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }

  ctx2D.putImageData(imageData, 0, 0);
  //console.log("Puntos de relleno: ", puntos);
  return puntos;
}
