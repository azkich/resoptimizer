export type ProcessEntryInput = {
  path: string;
  data: Uint8Array;
  quantize: boolean;
  minifyJson: boolean;
};

export function createWorkerPool(createWorker: () => Worker, size: number) {
  const n = Math.max(1, size);
  const workers = Array.from({ length: n }, () => createWorker());
  const idle: Worker[] = [...workers];
  const waitQueue: Array<(w: Worker) => void> = [];

  function acquire(): Promise<Worker> {
    const w = idle.pop();
    if (w) return Promise.resolve(w);
    return new Promise((resolve) => waitQueue.push(resolve));
  }

  function release(w: Worker) {
    const next = waitQueue.shift();
    if (next) next(w);
    else idle.push(w);
  }

  async function run(req: ProcessEntryInput): Promise<Uint8Array> {
    const w = await acquire();
    return new Promise((resolve, reject) => {
      const onMessage = (
        e: MessageEvent<{ ok: true; data: ArrayBuffer } | { ok: false; error: string }>,
      ) => {
        w.removeEventListener("message", onMessage);
        w.removeEventListener("error", onError);
        release(w);
        const d = e.data;
        if (d.ok) resolve(new Uint8Array(d.data));
        else reject(new Error(d.error));
      };
      const onError = (ev: ErrorEvent) => {
        w.removeEventListener("message", onMessage);
        w.removeEventListener("error", onError);
        release(w);
        reject(ev.error ?? new Error(ev.message));
      };
      w.addEventListener("message", onMessage);
      w.addEventListener("error", onError);

      const view = req.data;
      const ab =
        view.byteOffset === 0 && view.byteLength === view.buffer.byteLength
          ? view.buffer
          : view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
      w.postMessage(
        {
          path: req.path,
          data: ab,
          quantize: req.quantize,
          minifyJson: req.minifyJson,
        },
        [ab],
      );
    });
  }

  function terminate() {
    workers.forEach((w) => w.terminate());
  }

  return { run, terminate };
}
