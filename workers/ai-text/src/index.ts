interface Env {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  ALLOWED_ORIGINS?: string;
}

export interface OrganizedDescription {
  headline: string;
  paragraphs: string[];
  summarySuggestions: Array<{ label: string; value: string }>;
  featureSuggestions: string[];
}

const MAX_DESCRIPTION_LENGTH = 10000;
const DEFAULT_MODEL = "gpt-5.6-luna";

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "paragraphs", "summarySuggestions", "featureSuggestions"],
  properties: {
    headline: { type: "string", maxLength: 120 },
    paragraphs: {
      type: "array",
      minItems: 2,
      maxItems: 4,
      items: { type: "string", minLength: 1, maxLength: 1600 }
    },
    summarySuggestions: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value"],
        properties: {
          label: { type: "string", minLength: 1, maxLength: 80 },
          value: { type: "string", minLength: 1, maxLength: 120 }
        }
      }
    },
    featureSuggestions: {
      type: "array",
      maxItems: 20,
      items: { type: "string", minLength: 1, maxLength: 160 }
    }
  }
} as const;

const cors = (origin: string | null, env: Env): Record<string, string> => {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()).filter(Boolean);
  return origin && allowed.includes(origin) ? {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "vary": "Origin"
  } : {};
};

const json = (body: unknown, origin: string | null, env: Env, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors(origin, env) } });

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const explicitValueSupported = (value: string, source: string) => {
  const normalizedValue = normalized(value);
  const numbers = normalizedValue.match(/\d+(?:[.,]\d+)?/g) || [];
  if (numbers.length) return numbers.every((number) => source.includes(number));
  return normalizedValue.length >= 3 && source.includes(normalizedValue);
};

export const validateOrganizedDescription = (value: unknown): OrganizedDescription | null => {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.headline !== "string" || !candidate.headline.trim() || candidate.headline.length > 120) return null;
  if (!Array.isArray(candidate.paragraphs) || candidate.paragraphs.length < 2 || candidate.paragraphs.length > 4 || candidate.paragraphs.some((item) => typeof item !== "string" || !item.trim() || item.length > 1600)) return null;
  if (!Array.isArray(candidate.summarySuggestions) || candidate.summarySuggestions.length > 12) return null;
  const summaries = candidate.summarySuggestions.map((item) => {
    if (!item || typeof item !== "object") return null;
    const entry = item as Record<string, unknown>;
    return typeof entry.label === "string" && entry.label.trim() && entry.label.length <= 80 && typeof entry.value === "string" && entry.value.trim() && entry.value.length <= 120
      ? { label: entry.label.trim(), value: entry.value.trim() }
      : null;
  });
  if (summaries.some((item) => !item)) return null;
  if (!Array.isArray(candidate.featureSuggestions) || candidate.featureSuggestions.length > 20 || candidate.featureSuggestions.some((item) => typeof item !== "string" || !item.trim() || item.length > 160)) return null;
  return {
    headline: candidate.headline.trim(),
    paragraphs: candidate.paragraphs.map((item) => String(item).trim()),
    summarySuggestions: summaries as Array<{ label: string; value: string }>,
    featureSuggestions: candidate.featureSuggestions.map((item) => String(item).trim())
  };
};

const extractOutputText = (response: Record<string, unknown>) => {
  if (typeof response.output_text === "string") return response.output_text;
  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content) ? (item as Record<string, unknown>).content as Array<Record<string, unknown>> : [];
    const text = content.find((part) => part.type === "output_text" && typeof part.text === "string")?.text;
    if (typeof text === "string") return text;
  }
  return "";
};

export const buildOpenAIRequest = (description: string, propertyName: string, location: string, model: string) => ({
  model,
  store: false,
  reasoning: { effort: "low" },
  max_output_tokens: 2200,
  instructions: [
    "Actuá como editora profesional de presentaciones inmobiliarias premium en español rioplatense.",
    "Usá exclusivamente hechos explícitos del texto original. No inventes, completes ni deduzcas superficies, ambientes, distancias, materiales, ubicación, vistas, servicios o equipamiento.",
    "Conservá el significado, eliminá repeticiones y evitá superlativos, exageraciones y frases vacías.",
    "Creá un título concreto de aproximadamente 8 a 12 palabras y entre 2 y 4 párrafos coherentes.",
    "Sugerí datos destacados y características sólo cuando estén expresamente presentes. Si no hay suficientes hechos, devolvé listas vacías.",
    "No incluyas explicaciones fuera de la estructura solicitada."
  ].join(" "),
  input: [{
    role: "user",
    content: [{
      type: "input_text",
      text: JSON.stringify({
        propertyName: propertyName || null,
        location: location || null,
        originalDescription: description
      })
    }]
  }],
  text: {
    format: {
      type: "json_schema",
      name: "organized_property_description",
      strict: true,
      schema: responseSchema
    }
  }
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin, env) });
    if (!origin || !Object.keys(cors(origin, env)).length) return json({ error: "Origen no autorizado." }, origin, env, 403);
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/organize-description") return json({ error: "No encontrado." }, origin, env, 404);
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) return json({ error: "La solicitud debe enviarse como JSON." }, origin, env, 415);
    if (!env.OPENAI_API_KEY) return json({ error: "La organización inteligente todavía no está configurada.", code: "not_configured" }, origin, env, 503);

    try {
      const body = await request.json() as Record<string, unknown>;
      const description = clean(body.description, MAX_DESCRIPTION_LENGTH + 1);
      const propertyName = clean(body.propertyName, 160);
      const location = clean(body.location, 240);
      if (!description) return json({ error: "Escribí una descripción antes de organizarla." }, origin, env, 400);
      if (description.length > MAX_DESCRIPTION_LENGTH) return json({ error: "La descripción es demasiado extensa." }, origin, env, 400);

      const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildOpenAIRequest(description, propertyName, location, env.OPENAI_MODEL || DEFAULT_MODEL))
      });
      if (!openAIResponse.ok) return json({ error: "No se pudo organizar la descripción." }, origin, env, 502);
      const payload = await openAIResponse.json() as Record<string, unknown>;
      const outputText = extractOutputText(payload);
      let parsed: unknown;
      try { parsed = JSON.parse(outputText); }
      catch { return json({ error: "La propuesta recibida no tiene un formato válido." }, origin, env, 502); }
      const result = validateOrganizedDescription(parsed);
      if (!result) return json({ error: "La propuesta recibida no tiene un formato válido." }, origin, env, 502);

      const source = normalized(description);
      const unsupported = result.summarySuggestions.some((item) => !explicitValueSupported(item.value, source));
      if (unsupported) return json({ error: "La propuesta incluyó un dato que no pudo verificarse en el texto original." }, origin, env, 502);
      return json(result, origin, env);
    } catch {
      return json({ error: "No se pudo organizar la descripción." }, origin, env, 500);
    }
  }
};

