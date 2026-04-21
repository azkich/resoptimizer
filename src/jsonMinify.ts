const JSON_LIKE = /\.(json|mcmeta)$/i;

export function shouldMinifyJsonPath(path: string): boolean {
  return JSON_LIKE.test(path.replace(/\\/g, "/"));
}

function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  const o = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const k of Object.keys(o).sort()) {
    sorted[k] = sortKeysDeep(o[k]);
  }
  return sorted;
}

export function minifyJsonBytes(data: Uint8Array): Uint8Array {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(data);
  } catch {
    return data;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    const stable = sortKeysDeep(parsed);
    const out = JSON.stringify(stable);
    return new TextEncoder().encode(out);
  } catch {
    return data;
  }
}
