# Organización manual de descripciones con ChatGPT

El administrador no llama a ninguna API de inteligencia artificial y no contiene claves, credenciales ni configuración de facturación.

La organización se realiza manualmente:

1. escribir o pegar la descripción completa de la propiedad;
2. pulsar **Copiar mensaje para ChatGPT**;
3. pegar el mensaje en una conversación de ChatGPT;
4. copiar la respuesta completa;
5. pegarla en **Pegar respuesta de ChatGPT**;
6. pulsar **Aplicar organización**;
7. revisar y editar la propuesta antes de guardarla.

Este método no genera cargos de API desde el administrador. La disponibilidad y condiciones de uso de ChatGPT dependen de la cuenta que utilice cada persona.

## Formato esperado

ChatGPT debe responder únicamente con JSON válido:

```json
{
  "headline": "Las vistas como protagonistas.",
  "paragraphs": [
    "Primer párrafo.",
    "Segundo párrafo."
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
```

No debe incluir bloques de Markdown, comentarios ni explicaciones antes o después del JSON.

## Validación local

Al pulsar **Aplicar organización**, el navegador comprueba localmente:

- que la respuesta sea JSON válido;
- que `headline` sea texto;
- que `paragraphs` contenga entre 2 y 4 textos;
- que cada dato sugerido tenga `label` y `value`;
- que las características sugeridas sean textos.

La respuesta no se envía a ningún servidor desde el administrador.

Si la validación falla, la descripción original y la versión organizada anterior permanecen intactas.

## Control del usuario

La propuesta nunca se publica ni se incorpora silenciosamente:

- el título y los párrafos son editables;
- los párrafos pueden eliminarse y reordenarse;
- cada dato y característica sugeridos puede agregarse o ignorarse;
- se evitan duplicados equivalentes;
- si ya existe una versión organizada, el administrador pide confirmación antes de reemplazarla.

La persona responsable debe revisar que ChatGPT no haya agregado información ausente en la descripción original.

