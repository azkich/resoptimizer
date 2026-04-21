export type Lang = "en" | "ru";

const STORAGE = "resoptimizer-lang";

export const STR = {
  en: {
    title: "ResOptimizer",
    subtitle:
      "Minecraft Java resource pack optimizer: lossless PNG, optional quantization & JSON minify. .zip in the browser.",
    drop: "Drop a .zip resource pack here",
    dropHint: ".zip only",
    browse: "Browse",
    start: "Start processing",
    noFile: "No file selected",
    warn500: "Archives over 500 MB are not processed.",
    optQuant: "Color quantization (256 colors, may change pixels slightly)",
    optJson: "Minify JSON / .mcmeta",
    stBefore: "Archive size (before)",
    stAfter: "Output .zip size",
    stSaved: "Saved",
    stPng: "PNG files",
    stAll: "All files",
    download: "Download optimized .zip",
    footer:
      "PNG uses standard DEFLATE (zlib-compatible). Minecraft accepts any valid PNG resource pack in .zip format.",
    progressExtract: "Extracting…",
    progressPng: "Optimizing PNG…",
    progressJson: "Minifying JSON…",
    progressCopy: "Copying…",
    progressZip: "Building ZIP…",
    errNoFile: "Select a .zip file first.",
    errType: "Use a .zip resource pack only.",
    errSize: "File too large (> 500 MB).",
    errGeneric: "Error:",
    selected: "Selected:",
    faqBtn: "FAQ",
    faqTitle: "Frequently asked questions",
    faqClose: "Close",
    faqPngTitle: "How PNG images are optimized",
    faqPngBody:
      "ResOptimizer reads your .zip resource pack and finds every PNG in every folder. Each PNG is decoded to pixels, then encoded again as a new PNG. That removes extra chunks (metadata such as EXIF, text chunks, iCCP, and similar) and recompresses the image data with DEFLATE, compatible with the zlib-based decoding Minecraft uses for PNG.\n\nWhen color quantization is off, the goal is lossless pixel preservation: the same pixels are written back, often with a smaller file. Fully opaque textures (no transparency) may be stored in a more compact color mode.",
    faqJsonTitle: "Minify JSON / .mcmeta",
    faqJsonBody:
      "When this option is enabled, files whose names end with .json or .mcmeta are read as UTF-8 JSON, parsed, and written back with JSON.stringify — that removes unnecessary spaces and line breaks. Object keys are sorted alphabetically so output is stable across runs. The logical content stays the same for valid JSON. If a file is not valid JSON, it is left unchanged.",
    faqQuantTitle: "Color quantization",
    faqQuantBody:
      "When enabled, PNG texture colors are reduced to 256 colors. File size can drop a lot, but colors may differ slightly from the original — this is not lossless. The option is off by default; turn it on only if you accept possible visual changes.",
  },
  ru: {
    title: "ResOptimizer",
    subtitle:
      "Оптимизация ресурс-паков Minecraft Java: PNG без потерь, опционально квантование и минификация JSON. Только .zip в браузере.",
    drop: "Перетащите .zip ресурс-пака сюда",
    dropHint: "только .zip",
    browse: "Обзор",
    start: "Начать обработку",
    noFile: "Файл не выбран",
    warn500: "Архивы больше 500 МБ не обрабатываются.",
    optQuant: "Квантование цвета (256 цветов, возможны мелкие отличия)",
    optJson: "Минификация JSON / .mcmeta",
    stBefore: "Размер архива (до)",
    stAfter: "Размер .zip (после)",
    stSaved: "Сэкономлено",
    stPng: "Файлов PNG",
    stAll: "Всего файлов",
    download: "Скачать .zip",
    footer:
      "PNG со стандартным DEFLATE. Minecraft принимает валидный ресурс-пак только в формате .zip.",
    progressExtract: "Распаковка…",
    progressPng: "Оптимизация PNG…",
    progressJson: "Минификация JSON…",
    progressCopy: "Копирование…",
    progressZip: "Сборка ZIP…",
    errNoFile: "Сначала выберите .zip.",
    errType: "Нужен только ресурс-пак в формате .zip.",
    errSize: "Файл слишком большой (> 500 МБ).",
    errGeneric: "Ошибка:",
    selected: "Выбрано:",
    faqBtn: "FAQ",
    faqTitle: "Частые вопросы",
    faqClose: "Закрыть",
    faqPngTitle: "Как оптимизируются PNG",
    faqPngBody:
      "ResOptimizer распаковывает ваш .zip ресурс-пака и находит все PNG во всех папках. Каждый PNG декодируется в пиксели и снова кодируется в новый PNG. Так удаляются лишние чанки (метаданные: EXIF, текстовые блоки, iCCP и т.п.), и заново сжимаются данные изображения через DEFLATE (совместим с zlib, который использует Minecraft).\n\nЕсли квантование выключено, цель — сохранить пиксели без потерь: те же значения, но часто меньший размер файла. Полностью непрозрачные текстуры могут сохраняться в более компактном цветовом режиме.",
    faqJsonTitle: "Минификация JSON / .mcmeta",
    faqJsonBody:
      "Если опция включена, файлы с именами, оканчивающимися на .json или .mcmeta, читаются как UTF-8 JSON, разбираются и записываются обратно через JSON.stringify — убираются лишние пробелы и переводы строк. Ключи объектов сортируются по алфавиту, чтобы результат был стабильным между запусками. Содержимое для корректного JSON не меняется. Если файл не является валидным JSON, он не меняется.",
    faqQuantTitle: "Квантование цвета",
    faqQuantBody:
      "Если опция включена, цвета PNG текстуры сокращаются до 256 цветов. Размер файла часто сильно уменьшается, но оттенки могут слегка отличаться от оригинала — это уже не режим без потерь. По умолчанию опция выключена; включайте её только если готовы к возможным визуальным отличиям.",
  },
} as const;

export function getLang(): Lang {
  const v = localStorage.getItem(STORAGE);
  return v === "ru" ? "ru" : "en";
}

export function setLang(lang: Lang): void {
  localStorage.setItem(STORAGE, lang);
}

export function t(lang: Lang, key: keyof (typeof STR)["en"]): string {
  return STR[lang][key] ?? STR.en[key];
}
