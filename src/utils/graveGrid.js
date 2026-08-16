// Shared geometry helpers for rendering a grave block's slot grid.
// A block is defined by 4 corner points (top-left, top-right, bottom-right,
// bottom-left), each {x, y} as a percentage (0-100) of the cemetery photo's
// width/height. Individual slot polygons are derived via bilinear
// interpolation across those 4 corners, so a rotated/skewed block (following
// the road/plot orientation in an aerial photo) still yields an evenly
// spaced grid instead of an axis-aligned bounding-box grid.

function lerpPoint(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function bilinearPoint(corners, u, v) {
  const [tl, tr, br, bl] = corners;
  const top = lerpPoint(tl, tr, u);
  const bottom = lerpPoint(bl, br, u);
  return lerpPoint(top, bottom, v);
}

export function getSlotCorners(corners, rows, cols, rowIndex, colIndex) {
  const u0 = colIndex / cols;
  const u1 = (colIndex + 1) / cols;
  const v0 = rowIndex / rows;
  const v1 = (rowIndex + 1) / rows;
  return [
    bilinearPoint(corners, u0, v0),
    bilinearPoint(corners, u1, v0),
    bilinearPoint(corners, u1, v1),
    bilinearPoint(corners, u0, v1),
  ];
}

export function pointsToSvgPolygon(points) {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}

export function getPolygonCentroid(points) {
  const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  return { x, y };
}
