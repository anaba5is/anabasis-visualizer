// The renderer and label placement must use the same unobstructed rectangle.
export function fitMapViewport(width, height, { headers, panels, tools, intro }) {
  const gutter = Math.min(38, Math.max(10, width * .029));
  let left = intro ? Math.min(width * .5, intro.right + gutter * .7) : gutter;
  let top = Math.max(0, ...headers.map(box => box?.bottom ?? 0)) + 9;
  let right = width - gutter;
  let bottom = height - 8;

  for (const box of panels) {
    if (!box) continue;
    const isSidebar = box.width < width * .57 && box.left > width * .4;
    if (isSidebar) right = Math.min(right, box.left - gutter * .56);
    else bottom = Math.min(bottom, box.top - 8);
  }
  for (const box of tools) {
    if (box && box.right > left && box.left < right) bottom = Math.min(bottom, box.top - 8);
  }

  // Overlays can briefly intersect during a resize. Keep the fallback area
  // within the map so its center and label bounds still agree.
  const minWidth = Math.min(54, width);
  const minHeight = Math.min(54, height);
  left = Math.max(0, Math.min(left, width - minWidth));
  top = Math.min(top, height - minHeight);
  right = Math.max(right, left + minWidth);
  bottom = Math.max(bottom, top + minHeight);

  const usableWidth = right - left;
  const usableHeight = bottom - top;
  const baseline = Math.min(usableWidth / .325, usableHeight / .215);
  return {
    width,
    height,
    x: (left + right) / 2,
    y: (top + bottom) / 2,
    baseline,
    labelBounds: { left, top, right, bottom },
    world: baseline ? Math.min(usableWidth * .48, usableHeight * .485) / baseline : 0,
  };
}
