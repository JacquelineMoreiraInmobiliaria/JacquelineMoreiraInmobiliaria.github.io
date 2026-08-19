export const normalizeSuggestion = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export const buildChatGptDescriptionPrompt = ({ description, propertyName = "", location = "" }) => {
  const context = [
    propertyName.trim() ? "NOMBRE DE LA PROPIEDAD:\n" + propertyName.trim() : "",
    location.trim() ? "UBICACIÓN VISIBLE:\n" + location.trim() : ""
  ].filter(Boolean).join("\n\n");

  return `Sos editor de textos inmobiliarios para presentaciones premium.

Organizá la descripción siguiente sin inventar ningún dato.

Usá exclusivamente información explícitamente presente.

Generá:

1. headline:
un título breve, elegante y concreto de aproximadamente 8 a 12 palabras.

2. paragraphs:
entre 2 y 4 párrafos coherentes, agrupando temas relacionados y sin repetir información.

3. summarySuggestions:
datos destacados explícitos, por ejemplo superficie, dormitorios, baños, plantas u otros datos concretos.

4. featureSuggestions:
características explícitas de la propiedad, ordenadas aproximadamente de mayor relevancia comercial a menor.

No inventes superficies, dormitorios, baños, materiales, servicios, ubicación, distancias ni ninguna otra característica.
Si un dato no aparece expresamente, no lo incluyas.
No agregues frases vacías ni exageraciones.

Respondé únicamente con JSON válido, sin markdown, sin comentarios y sin texto antes o después.

Usá exactamente esta estructura:
{
  "headline": "Título destacado",
  "paragraphs": [
    "Párrafo 1",
    "Párrafo 2"
  ],
  "summarySuggestions": [
    {
      "label": "Dormitorios",
      "value": "4"
    }
  ],
  "featureSuggestions": [
    "Piscina climatizada",
    "Vista al mar"
  ]
}

${context ? context + "\n\n" : ""}DESCRIPCIÓN ORIGINAL:
${description.trim()}`;
};

export const parseChatGptDescriptionResponse = (source) => {
  let proposal;
  try {
    proposal = JSON.parse(String(source || "").trim());
  } catch {
    return { ok: false, error: "No pudimos leer la respuesta de ChatGPT. Revisá que hayas pegado el JSON completo." };
  }
  const valid = proposal
    && typeof proposal.headline === "string"
    && Boolean(proposal.headline.trim())
    && Array.isArray(proposal.paragraphs)
    && proposal.paragraphs.length >= 2
    && proposal.paragraphs.length <= 4
    && proposal.paragraphs.every((item) => typeof item === "string" && item.trim())
    && Array.isArray(proposal.summarySuggestions)
    && proposal.summarySuggestions.every((item) => item && typeof item === "object" && typeof item.label === "string" && item.label.trim() && typeof item.value === "string" && item.value.trim())
    && Array.isArray(proposal.featureSuggestions)
    && proposal.featureSuggestions.every((item) => typeof item === "string" && item.trim());
  if (!valid) return { ok: false, error: "No pudimos leer la respuesta de ChatGPT. Revisá que hayas pegado el JSON completo." };
  return {
    ok: true,
    value: {
      headline: proposal.headline.trim(),
      paragraphs: proposal.paragraphs.map((item) => item.trim()),
      summarySuggestions: proposal.summarySuggestions.map((item) => ({ label: item.label.trim(), value: item.value.trim() })),
      featureSuggestions: proposal.featureSuggestions.map((item) => item.trim())
    }
  };
};

