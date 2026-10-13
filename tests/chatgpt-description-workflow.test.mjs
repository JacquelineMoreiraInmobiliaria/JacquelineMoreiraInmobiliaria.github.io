import test from "node:test";
import assert from "node:assert/strict";
import {
  buildChatGptDescriptionPrompt,
  normalizeSuggestion,
  parseChatGptDescriptionResponse
} from "../src/scripts/chatgpt-description-workflow.js";

const longDescription = "Chacra de 5 hectáreas en Piriápolis con casa de 3 dormitorios, 2 baños, piscina, barbacoa y vista al mar. Construcción tradicional con aberturas DVH. Se encuentra a pocos minutos de la playa.";
const validResponse = JSON.stringify({
  headline: "Naturaleza y vista al mar cerca de Piriápolis.",
  paragraphs: [
    "Chacra de 5 hectáreas en Piriápolis, con vista al mar y cercanía a la playa.",
    "La casa cuenta con 3 dormitorios, 2 baños y construcción tradicional.",
    "La propiedad ofrece piscina, barbacoa y aberturas DVH."
  ],
  summarySuggestions: [
    { label: "Superficie", value: "5 hectáreas" },
    { label: "Dormitorios", value: "3" },
    { label: "Baños", value: "2" }
  ],
  featureSuggestions: ["Piscina", "Barbacoa", "Vista al mar", "Aberturas DVH"]
});

test("genera el mensaje con descripción, nombre, ubicación y prohibición de inventar", () => {
  const prompt = buildChatGptDescriptionPrompt({ description: longDescription, propertyName: "Chacra de prueba", location: "Piriápolis" });
  assert.match(prompt, /Respondé únicamente con JSON válido/);
  assert.match(prompt, /sin inventar ningún dato/);
  assert.match(prompt, /Chacra de prueba/);
  assert.match(prompt, /Piriápolis/);
  assert.match(prompt, /5 hectáreas/);
});

test("acepta una respuesta válida con 2 a 4 párrafos", () => {
  const parsed = parseChatGptDescriptionResponse(validResponse);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.value.paragraphs.length, 3);
  assert.equal(parsed.value.summarySuggestions.length, 3);
});

test("rechaza JSON inválido sin producir una propuesta parcial", () => {
  const parsed = parseChatGptDescriptionResponse('{"headline": "incompleto"');
  assert.equal(parsed.ok, false);
  assert.equal("value" in parsed, false);
});

test("rechaza una estructura con un solo párrafo", () => {
  const parsed = parseChatGptDescriptionResponse(JSON.stringify({
    headline: "Título",
    paragraphs: ["Uno"],
    summarySuggestions: [],
    featureSuggestions: []
  }));
  assert.equal(parsed.ok, false);
});

test("normaliza equivalentes para evitar duplicados", () => {
  assert.equal(normalizeSuggestion("Piscina climatizada"), normalizeSuggestion("PISCINA CLIMATIZADA"));
  assert.equal(normalizeSuggestion("Baños"), "banos");
});

