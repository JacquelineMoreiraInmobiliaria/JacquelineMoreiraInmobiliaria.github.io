import test from "node:test";
import assert from "node:assert/strict";
import { normalizeFeatureCategory, normalizeSummaryIconId } from "../src/scripts/publication-normalization.js";

const publishedSummary = [
  ["Superficie", "5 hectáreas", "surface"],
  ["Entorno", "Valle y bosque", "land"],
  ["Piscina", "Exterior", "pool"],
  ["Lago", "Con puente", "view"]
];

const canonicalSummary = (items) => items.map((item) => ({
  label: item.label.trim(),
  value: item.value.trim(),
  icon: normalizeSummaryIconId(item.icon),
  show: true
}));

const canonicalFeatures = (items) => items.map((item) => ({
  label: item.label.trim(),
  category: normalizeFeatureCategory(item.category)
}));

const canonicalLocation = (location) => location.enabled ? {
  enabled: true,
  visibleName: location.visibleName || "",
  address: location.address || "",
  latitude: location.latitude || "",
  longitude: location.longitude || ""
} : { enabled: false };

test("Refugio del Mar normaliza los iconos visuales sin alterar orden ni contenido", () => {
  const draft = publishedSummary.map(([label, value, icon]) => ({ label, value, icon, show: true }));
  const published = publishedSummary.map(([label, value, icon]) => ({ label, value, icon, show: true }));
  assert.deepEqual(canonicalSummary(draft), canonicalSummary(published));
  assert.equal(normalizeSummaryIconId("Superficie"), "surface");
  assert.equal(normalizeSummaryIconId("Terreno"), "land");
  assert.equal(normalizeSummaryIconId("Piscina"), "pool");
  assert.equal(normalizeSummaryIconId("Vista"), "view");
});

test("cambios reales de valor, icono u orden siguen detectándose", () => {
  const base = publishedSummary.map(([label, value, icon]) => ({ label, value, icon }));
  assert.notDeepEqual(canonicalSummary([{ ...base[0], value: "6 hectáreas" }, ...base.slice(1)]), canonicalSummary(base));
  assert.notDeepEqual(canonicalSummary([{ ...base[0], icon: "pool" }, ...base.slice(1)]), canonicalSummary(base));
  assert.notDeepEqual(canonicalSummary([base[1], base[0], ...base.slice(2)]), canonicalSummary(base));
});

test("la categoría ausente del draft usa el mismo default structural del exportador", () => {
  const labels = ["Paredes dobles", "Amplio living y salas de estar", "Superficie ampliable hasta 20 hectáreas. Consultar precio."];
  const draft = labels.map((label) => ({ label }));
  const published = labels.map((label) => ({ label, category: "structural" }));
  assert.deepEqual(canonicalFeatures(draft), canonicalFeatures(published));
  assert.notDeepEqual(canonicalFeatures([...draft].reverse()), canonicalFeatures(published));
  assert.notDeepEqual(canonicalFeatures(draft.slice(0, -1)), canonicalFeatures(published));
});

test("ubicación desactivada ignora datos conservados y activada los compara", () => {
  const draft = { enabled: false, visibleName: "Piriápolis", address: "Dirección conservada", latitude: "-34.8", longitude: "-55.3" };
  assert.deepEqual(canonicalLocation(draft), canonicalLocation({ enabled: false }));
  assert.notDeepEqual(canonicalLocation({ ...draft, enabled: true }), canonicalLocation({ enabled: true }));
});
