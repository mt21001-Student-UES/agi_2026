/**
 * Flood Fill sobre bitmap
 * @param {CanvasRenderingContext2D} ctx contexto del canvas
 * @param {number} x punto inicial X
 * @param {number} y punto inicial Y
 * @param {Array<number>} nuevoColor [r,g,b]
 */
export default function floodFill(ctx, x, y, nuevoColor) {
  console.warn("Algoritmo Flood Fill no testeado");
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;

  function getColor(px, py) {
    const idx = (py * ctx.canvas.width + px) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  }

  function setColor(px, py, color) {
    const idx = (py * ctx.canvas.width + px) * 4;
    data[idx] = color[0];
    data[idx + 1] = color[1];
    data[idx + 2] = color[2];
    data[idx + 3] = 255;
  }

  function coloresIguales(c1, c2) {
    return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2];
  }

  const objetivo = getColor(x, y);
  if (coloresIguales(objetivo, nuevoColor)) return;

  const stack = [[x, y]];
  while (stack.length > 0) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= ctx.canvas.width || cy >= ctx.canvas.height)
      continue;

    const actual = getColor(cx, cy);
    if (!coloresIguales(actual, objetivo)) continue;

    setColor(cx, cy, nuevoColor);

    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}
