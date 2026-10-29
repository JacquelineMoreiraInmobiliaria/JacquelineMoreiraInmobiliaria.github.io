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

Organizá la descripción como una pieza comercial breve. No intentes conservar toda la información original.

Usá exclusivamente hechos explícitamente presentes para cualquier información objetiva. Priorizá superficie, distribución, dormitorios, baños, plantas, entorno, vistas, piscina, barbacoa, casa de huéspedes, construcciones auxiliares y cualidades realmente diferenciales cuando estén mencionadas. Omití detalles secundarios y no repitas datos que luego podrían aparecer como datos destacados o características.

Generá:

1. headline:
una frase breve, editorial y evocativa de 5 a 10 palabras. Puede inspirarse en el entorno, el paisaje o el carácter de la propiedad aunque no sea una frase literal. No puede afirmar una característica objetiva que no exista en el texto.

2. paragraphs:
2 o 3 párrafos cortos, preferentemente 2. Cada párrafo debe tener aproximadamente 2 a 4 oraciones y concentrar información comercial relevante.

3. summarySuggestions:
entre 4 y 6 datos destacados concretos y fáciles de escanear.

4. featureSuggestions:
entre 8 y 12 características comerciales realmente relevantes, ordenadas de mayor relevancia a menor.

No inventes superficies, dormitorios, baños, materiales, servicios, ubicación, distancias ni ninguna otra característica.
Si un dato no aparece expresamente, no lo incluyas.
No agregues frases vacías, exageraciones ni detalles técnicos secundarios.

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
    && proposal.paragraphs.length <= 3
    && proposal.paragraphs.every((item) => typeof item === "string" && item.trim())
    && Array.isArray(proposal.summarySuggestions)
    && proposal.summarySuggestions.length >= 4
    && proposal.summarySuggestions.length <= 6
    && proposal.summarySuggestions.every((item) => item && typeof item === "object" && typeof item.label === "string" && item.label.trim() && typeof item.value === "string" && item.value.trim())
    && Array.isArray(proposal.featureSuggestions)
    && proposal.featureSuggestions.length >= 8
    && proposal.featureSuggestions.length <= 12
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

