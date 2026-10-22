export type NormalizedCrop = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** Pick a normalized crop rect (0–1) for a fixed aspect ratio, focal offset, and zoom. */
export function computeNormalizedCrop(
  naturalW: number,
  naturalH: number,
  aspectRatio: number,
  offset: { x: number; y: number },
  zoom: number
): NormalizedCrop {
  const z = Math.max(1, Math.min(zoom, 4));
  let cropW: number;
  let cropH: number;
  if (naturalW / naturalH > aspectRatio) {
    cropH = naturalH / z;
    cropW = cropH * aspectRatio;
  } else {
    cropW = naturalW / z;
    cropH = cropW / aspectRatio;
  }
  cropW = Math.min(cropW, naturalW);
  cropH = Math.min(cropH, naturalH);
  const maxX = Math.max(0, naturalW - cropW);
  const maxY = Math.max(0, naturalH - cropH);
  const left = Math.min(maxX, Math.max(0, offset.x * naturalW - cropW / 2));
  const top = Math.min(maxY, Math.max(0, offset.y * naturalH - cropH / 2));
  return {
    x: left / naturalW,
    y: top / naturalH,
    w: cropW / naturalW,
    h: cropH / naturalH,
  };
}
