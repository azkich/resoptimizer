import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import "./App.css";
import { extractArchive } from "./archives";
import { getLang, setLang, t, type Lang } from "./i18n";
import { shouldMinifyJsonPath } from "./jsonMinify";
import { shouldProcessPngOptimization } from "./png";
import ProcessEntryWorker from "./processEntry.worker?worker";
import { createWorkerPool } from "./workerPool";

const MAX_BYTES = 500 * 1024 * 1024;

type WorkerPool = ReturnType<typeof createWorkerPool>;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function App() {
  const [lang, setLangState] = useState<Lang>(getLang);
  const [file, setFile] = useState<File | null>(null);
  const [quantize, setQuantize] = useState(false);
  const [minifyJson, setMinifyJson] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [stats, setStats] = useState<{
    before: number;
    after: number;
    pngs: number;
    files: number;
  } | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    if (!faqOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFaqOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [faqOpen]);

  const switchLang = (L: Lang) => {
    setLang(L);
    setLangState(L);
    document.documentElement.lang = L === "ru" ? "ru" : "en";
  };

  const onFile = useCallback((f: File | null) => {
    setError(null);
    setResultBlob(null);
    setStats(null);
    setFile(f);
  }, []);

  const run = async () => {
    setError(null);
    setResultBlob(null);
    setStats(null);

    if (!file) {
      setError(t(lang, "errNoFile"));
      return;
    }
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".zip")) {
      setError(t(lang, "errType"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t(lang, "errSize"));
      return;
    }

    setBusy(true);
    setProgress(0);
    setProgressMsg(t(lang, "progressExtract"));

    let pool: WorkerPool | null = null;
    try {
      pool = createWorkerPool(
        () => new ProcessEntryWorker(),
        Math.min(4, Math.max(1, navigator.hardwareConcurrency || 4)),
      );
      const entries = await extractArchive(file);
      const total = entries.length;
      let pngCount = 0;
      for (const ent of entries) {
        if (shouldProcessPngOptimization(ent.path, ent.data)) pngCount++;
      }

      const zipOut = new JSZip();
      let done = 0;
      const processed = await Promise.all(
        entries.map((ent) =>
          pool!
            .run({
              path: ent.path,
              data: ent.data,
              quantize,
              minifyJson,
            })
            .then((data) => {
              done++;
              setProgress(5 + (80 * done) / Math.max(1, total));
              let phase = t(lang, "progressCopy");
              if (shouldProcessPngOptimization(ent.path, ent.data))
                phase = t(lang, "progressPng");
              else if (minifyJson && shouldMinifyJsonPath(ent.path))
                phase = t(lang, "progressJson");
              setProgressMsg(`${phase} (${done}/${total})`);
              return { path: ent.path, data };
            }),
        ),
      );

      for (const item of processed) {
        zipOut.file(item.path, item.data, {
          compression: "DEFLATE",
          compressionOptions: { level: 9 },
        });
      }

      setProgress(90);
      setProgressMsg(t(lang, "progressZip"));
      const blob = await zipOut.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      });

      setProgress(100);
      setResultBlob(blob);
      setStats({
        before: file.size,
        after: blob.size,
        pngs: pngCount,
        files: total,
      });
    } catch (e) {
      console.error(e);
      setError(
        `${t(lang, "errGeneric")} ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      pool?.terminate();
      setBusy(false);
      setProgress(0);
      setProgressMsg("");
    }
  };

  const download = () => {
    if (!resultBlob || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "") || "resource-pack";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(resultBlob);
    a.download = `${base}-optimized.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const tooBig = file !== null && file.size > MAX_BYTES;
  const canStart = file !== null && !tooBig && !busy;

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>{t(lang, "title")}</h1>
          <p className="sub">{t(lang, "subtitle")}</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-faq"
            onClick={() => setFaqOpen(true)}
          >
            {t(lang, "faqBtn")}
          </button>
          <div className="lang" role="group" aria-label="Language">
            <button
              type="button"
              aria-pressed={lang === "en"}
              onClick={() => switchLang("en")}
            >
              EN
            </button>
            <button
              type="button"
              aria-pressed={lang === "ru"}
              onClick={() => switchLang("ru")}
            >
              RU
            </button>
          </div>
        </div>
      </header>

      {faqOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setFaqOpen(false)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="faq-dialog-title">{t(lang, "faqTitle")}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setFaqOpen(false)}
              >
                {t(lang, "faqClose")}
              </button>
            </div>
            <div className="modal-body">
              <section className="faq-block">
                <h3>{t(lang, "faqPngTitle")}</h3>
                {t(lang, "faqPngBody")
                  .split("\n\n")
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </section>
              <section className="faq-block">
                <h3>{t(lang, "faqJsonTitle")}</h3>
                {t(lang, "faqJsonBody")
                  .split("\n\n")
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </section>
              <section className="faq-block">
                <h3>{t(lang, "faqQuantTitle")}</h3>
                {t(lang, "faqQuantBody")
                  .split("\n\n")
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </section>
            </div>
          </div>
        </div>
      )}

      <section className="panel">
        <div
          className="drop"
          role="button"
          tabIndex={0}
          onClick={() => document.getElementById("file-input")?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("dragover");
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("dragover");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("dragover");
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
          }}
        >
          <p>
            <strong>{t(lang, "drop")}</strong>
          </p>
          <p className="hint">{t(lang, "dropHint")}</p>
        </div>

        <div className="row">
          <label className="btn">
            {t(lang, "browse")}
            <input
              id="file-input"
              className="file-input"
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={!canStart}
            onClick={() => void run()}
          >
            {t(lang, "start")}
          </button>
        </div>

        <p className="file-name">
          {file
            ? `${t(lang, "selected")} ${file.name} (${formatBytes(file.size)})`
            : t(lang, "noFile")}
        </p>

        {tooBig && <div className="warn">{t(lang, "warn500")}</div>}

        <div className="options">
          <label>
            <input
              type="checkbox"
              checked={quantize}
              onChange={(e) => setQuantize(e.target.checked)}
            />
            <span>{t(lang, "optQuant")}</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={minifyJson}
              onChange={(e) => setMinifyJson(e.target.checked)}
            />
            <span>{t(lang, "optJson")}</span>
          </label>
        </div>

        {busy && (
          <div className="progress-wrap">
            <div className="progress-bar">
              <div style={{ width: `${progress}%` }} />
            </div>
            <p className="progress-text">{progressMsg}</p>
          </div>
        )}

        {stats && (
          <div className="stats">
            <div className="stat">
              <div className="k">{t(lang, "stBefore")}</div>
              <div className="v">{formatBytes(stats.before)}</div>
            </div>
            <div className="stat">
              <div className="k">{t(lang, "stAfter")}</div>
              <div className="v">{formatBytes(stats.after)}</div>
            </div>
            <div className="stat">
              <div className="k">{t(lang, "stSaved")}</div>
              <div className="v">
                {stats.before > 0
                  ? `${(((stats.before - stats.after) / stats.before) * 100).toFixed(1)}%`
                  : "—"}
              </div>
            </div>
            <div className="stat">
              <div className="k">{t(lang, "stPng")}</div>
              <div className="v">{stats.pngs}</div>
            </div>
            <div className="stat">
              <div className="k">{t(lang, "stAll")}</div>
              <div className="v">{stats.files}</div>
            </div>
          </div>
        )}

        {error && <p className="err">{error}</p>}

        {resultBlob && (
          <div className="row" style={{ marginTop: "1rem" }}>
            <button type="button" className="btn-primary" onClick={download}>
              {t(lang, "download")}
            </button>
          </div>
        )}
      </section>

      <footer>{t(lang, "footer")}</footer>
    </div>
  );
}
