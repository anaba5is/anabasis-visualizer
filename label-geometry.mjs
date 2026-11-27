export function labelBox(x, y, { width, above, below }, anchor = 'middle') {
  const offset = anchor === 'start' ? 0 : anchor === 'end' ? width : width / 2;
  return { x, y, anchor, left: x - offset, right: x - offset + width, top: y - above, bottom: y + below };
}

export function labelFits(label, bounds, occupied) {
  if (!label || label.left < bounds.left || label.right > bounds.right
    || label.top < bounds.top || label.bottom > bounds.bottom) return false;

  return !occupied.some(other =>
    label.left < other.right && label.right > other.left
    && label.top < other.bottom && label.bottom > other.top,
  );
}

export function firstAvailableLabel(point, metrics, candidates, bounds, occupied) {
  for (const [dx, dy, anchor] of candidates) {
    const label = labelBox(point.x + dx, point.y + dy, metrics, anchor);
    if (labelFits(label, bounds, occupied)) return label;
  }
  return undefined;
}
