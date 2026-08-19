import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { buildOpenAIRequest, validateOrganizedDescription } from "../src/index";

const sample = "Chacra de 5 hectáreas en Piriápolis con casa de 3 dormitorios, 2 baños, piscina, barbacoa y vista al mar. Construcción tradicional con aberturas DVH. Se encuentra a pocos minutos de la playa.";
const result = {
  headline: "Entorno de chacra y vistas abiertas al mar.",
  paragraphs: [
    "Chacra de 5 hectáreas ubicada en Piriápolis, con vista al mar y cercanía a la playa.",
    "La casa cuenta con 3 dormitorios, 2 baños y construcción tradicional.",
    "La propiedad incorpora piscina, barbacoa y aberturas DVH."
  ],
  summarySuggestions: [
    { label: "Superficie", value: "5 hectáreas" },
    { label: "Dormitorios", value: "3 dormitorios" },
    { label: "Baños", value: "2 baños" }
  ],
  featureSuggestions: ["Piscina", "Barbacoa", "Vista al mar", "Aberturas DVH"]
};

describe("organización inmobiliaria", () => {
  afterEach(() => vi.restoreAllMocks());

  it("construye una solicitud compacta, estricta y sin herramientas", () => {
    const body = buildOpenAIRequest(sample, "Chacra de prueba", "Piriápolis", "gpt-5.6-luna");
    expect(body.store).toBe(false);
    expect(body.text.format.strict).toBe(true);
    expect(body.instructions).toContain("No inventes");
    expect(JSON.stringify(body)).not.toContain("image_url");
  });

  it("valida 2 a 4 párrafos y rechaza estructuras incompletas", () => {
    expect(validateOrganizedDescription(result)).toEqual(result);
    expect(validateOrganizedDescription({ ...result, paragraphs: ["Uno"] })).toBeNull();
  });

  it("devuelve la estructura esperada sin agregar datos ausentes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ output_text: JSON.stringify(result) }), { status: 200 })));
    const response = await worker.fetch(new Request("https://worker.example/organize-description", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "http://localhost:4321" },
      body: JSON.stringify({ description: sample, propertyName: "Chacra de prueba", location: "Piriápolis" })
    }), {
      OPENAI_API_KEY: "test-only",
      OPENAI_MODEL: "gpt-5.6-luna",
      ALLOWED_ORIGINS: "http://localhost:4321"
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(result);
    expect(result.summarySuggestions.some((item) => item.value.includes("4"))).toBe(false);
  });

  it("rechaza un dato numérico inventado aunque la estructura sea válida", async () => {
    const invented = {
      ...result,
      summarySuggestions: [...result.summarySuggestions, { label: "Cocheras", value: "4" }]
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ output_text: JSON.stringify(invented) }), { status: 200 })));
    const response = await worker.fetch(new Request("https://worker.example/organize-description", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Origin": "http://localhost:4321" },
      body: JSON.stringify({ description: sample })
    }), {
      OPENAI_API_KEY: "test-only",
      ALLOWED_ORIGINS: "http://localhost:4321"
    });
    expect(response.status).toBe(502);
  });
});

