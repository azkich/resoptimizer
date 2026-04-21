import pako from "pako";
import UPNG from "upng-js";
import {
  applyPaletteSync,
  buildPaletteSync,
  utils,
} from "image-q";

const { PointContainer } = utils;

(globalThis as unknown as { pako: typeof pako }).pako = pako;

export type PngOptions = {
  quantize: boolean;
};

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function isPngMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIG[i]) return false;
  }
  return true;
}

function isPngPath(path: string): boolean {
  return /\.png$/i.test(path.replace(/\\/g, "/"));
}

/** True when path looks like PNG and bytes are a real PNG (magic), not e.g. misnamed text. */
export function shouldProcessPngOptimization(
  path: string,
  bytes: Uint8Array,
): boolean {
  return isPngPath(path) && isPngMagicBytes(bytes);
}

function pickSmaller(
  original: Uint8Array,
  candidate: Uint8Array | null,
): Uint8Array {
  if (candidate && candidate.byteLength < original.byteLength) return candidate;
  return original;
}

export async function optimizePngBytes(
  bytes: Uint8Array,
  options: PngOptions,
): Promise<Uint8Array> {
  const ab = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );

  let dec: ReturnType<typeof UPNG.decode>;
  try {
    dec = UPNG.decode(ab);
  } catch {
    return bytes;
  }

  if (dec.tabs?.acTL != null) return bytes;
  if (dec.frames && dec.frames.length > 1) return bytes;

  let rgbaArr: ArrayBuffer[];
  try {
    rgbaArr = UPNG.toRGBA8(dec);
  } catch {
    return bytes;
  }
  if (!rgbaArr?.[0]) return bytes;

  const w = dec.width;
  const h = dec.height;
  const rgba = new Uint8Array(rgbaArr[0]);

  if (options.quantize) {
    try {
      const pc = PointContainer.fromUint8Array(rgba, w, h);
      const palette = buildPaletteSync([pc], {
        colors: 256,
        paletteQuantization: "wuquant",
      });
      const q = applyPaletteSync(pc, palette, {
        imageQuantization: "nearest",
        colorDistanceFormula: "euclidean-bt709",
      });
      const qRgba = q.toUint8Array();
      const enc = new Uint8Array(UPNG.encode([qRgba.buffer], w, h, 0));
      return pickSmaller(bytes, enc);
    } catch {
      /* fall through to lossless */
    }
  }

  try {
    const enc = new Uint8Array(UPNG.encode([rgba.buffer], w, h, 0));
    return pickSmaller(bytes, enc);
  } catch {
    return bytes;
  }
}
