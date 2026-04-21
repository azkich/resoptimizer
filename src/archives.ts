import JSZip from "jszip";

export type ArchiveEntry = { path: string; data: Uint8Array };

/**
 * Decode raw ZIP filename bytes. Strict UTF-8 first; on failure use one byte → one code unit
 * so any path (including § and odd OEM encodings) round-trips without throwing.
 */
export function decodeZipFileName(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]! & 0xff);
    return s;
  }
}

export async function extractArchive(file: File): Promise<ArchiveEntry[]> {
  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".zip")) throw new Error("format");
  const ab = await file.arrayBuffer();
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(ab, {
      decodeFileName: (bytes) =>
        decodeZipFileName(bytes as Uint8Array),
    });
  } catch (e) {
    throw new Error("ZIP: " + (e instanceof Error ? e.message : String(e)));
  }
  const out: ArchiveEntry[] = [];
  // JSZip adds entries in central-directory order; Object.keys keeps insertion order (ES2015+).
  const names = Object.keys(zip.files).filter((n) => !zip.files[n]!.dir);
  for (const name of names) {
    const data = await zip.files[name]!.async("uint8array");
    out.push({ path: name.replace(/\\/g, "/"), data });
  }
  return out;
}
