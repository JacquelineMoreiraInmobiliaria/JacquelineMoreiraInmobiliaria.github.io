const summaryIconAliases = Object.freeze({
  surface: "surface",
  superficie: "surface",
  area: "surface",
  home: "home",
  casa: "home",
  residencia: "home",
  bed: "bed",
  dormitorio: "bed",
  dormitorios: "bed",
  bath: "bath",
  bano: "bath",
  banos: "bath",
  temperature: "temperature",
  temperatura: "temperature",
  calefaccion: "temperature",
  pool: "pool",
  piscina: "pool",
  land: "land",
  terreno: "land",
  view: "view",
  vista: "view",
  garage: "garage",
  cochera: "garage"
});

const normalizedKey = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

/** @returns {"surface" | "home" | "bed" | "bath" | "temperature" | "pool" | "land" | "view" | "garage"} */
export const normalizeSummaryIconId = (value) => summaryIconAliases[normalizedKey(value)] || "home";

/** @returns {"structural" | "exterior"} */
export const normalizeFeatureCategory = (value) => value === "exterior" ? "exterior" : "structural";
