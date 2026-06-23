export default function floodFill(
  matriz,
  startX,
  startY,
  w,
  h,
  bordeValor = 1,
  rellenoValor = 2,
) {
  const stack = [[startX, startY]];

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= w || y < 0 || y >= h) continue;

    const idx = y * w + x;
    if (matriz[idx] !== 0) continue; // 0 = vacío, 1 = borde, 2 = ya rellenado

    matriz[idx] = rellenoValor;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return matriz;
}
