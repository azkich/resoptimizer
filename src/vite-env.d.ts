declare module "upng-js" {
  const UPNG: {
    decode(buffer: ArrayBuffer): {
      width: number;
      height: number;
      tabs?: { acTL?: unknown };
      frames?: unknown[];
    };
    toRGBA8(out: ReturnType<(typeof UPNG)["decode"]>): ArrayBuffer[];
    encode(
      bufs: ArrayBuffer[],
      w: number,
      h: number,
      ps: number,
      dels?: unknown,
      forbidPlte?: boolean,
    ): ArrayBuffer;
  };
  export default UPNG;
}
