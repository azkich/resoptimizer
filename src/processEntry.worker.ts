/// <reference lib="webworker" />

import { optimizePngBytes, shouldProcessPngOptimization } from "./png";
import { minifyJsonBytes, shouldMinifyJsonPath } from "./jsonMinify";

type WorkerRequest = {
  path: string;
  data: ArrayBuffer;
  quantize: boolean;
  minifyJson: boolean;
};

function postResult(out: Uint8Array) {
  const buf = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
  self.postMessage({ ok: true as const, data: buf }, [buf]);
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { path, data, quantize, minifyJson } = e.data;
  const u8 = new Uint8Array(data);
  try {
    let out = u8;
    if (shouldProcessPngOptimization(path, u8)) {
      out = await optimizePngBytes(u8, { quantize });
    } else if (minifyJson && shouldMinifyJsonPath(path)) {
      out = minifyJsonBytes(u8);
    }
    postResult(out);
  } catch {
    postResult(u8.slice());
  }
};
