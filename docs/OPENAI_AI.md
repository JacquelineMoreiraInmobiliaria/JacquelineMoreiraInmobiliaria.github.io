# Organización inteligente de descripciones

Esta integración usa un Worker separado llamado `moreira-ai-text`. El navegador sólo conoce la URL pública del Worker. La clave de OpenAI permanece guardada como secreto en Cloudflare.

## 1. Crear una cuenta y un proyecto

1. Ingresá en [OpenAI Platform](https://platform.openai.com/).
2. Creá o seleccioná un proyecto para Moreira Inmobiliaria.
3. Revisá los permisos de las personas que tendrán acceso.

La cuenta de ChatGPT y la facturación de la API son servicios separados.

## 2. Configurar facturación

En OpenAI Platform, abrí la sección de facturación y cargá créditos o un medio de pago. También es recomendable definir límites y alertas de uso.

La función sólo llama a la API cuando se pulsa **Organizar descripción**. No hace solicitudes al escribir, guardar o cambiar de paso.

## 3. Crear la API key

Creá una API key dentro del proyecto elegido. Copiala en el momento de creación y no la pegues en archivos del repositorio, HTML, JavaScript público ni localStorage.

## 4. Guardar la clave como secreto del Worker

Desde la raíz del repositorio:

```powershell
cd workers/ai-text
npm install
npx wrangler secret put OPENAI_API_KEY
```

Wrangler solicitará el valor de forma interactiva. No escribas la clave dentro de `wrangler.toml`.

## 5. Elegir el modelo

El modelo se configura en:

```toml
workers/ai-text/wrangler.toml
```

Valor inicial:

```toml
OPENAI_MODEL = "gpt-5.6-luna"
```

Podés cambiarlo por otro modelo compatible con Responses API y Structured Outputs. Después de cambiarlo, volvé a desplegar el Worker.

## 6. Desplegar el Worker

```powershell
cd workers/ai-text
npm install
npm run deploy
```

Wrangler mostrará una URL similar a:

```text
https://moreira-ai-text.<tu-subdominio>.workers.dev
```

## 7. Configurar la URL pública

Editá:

```text
public/config/ai-text.js
```

Y colocá únicamente la URL pública:

```js
window.MOREIRA_AI_TEXT = {
  workerUrl: "https://moreira-ai-text.<tu-subdominio>.workers.dev",
  timeoutMs: 25000
};
```

No agregues `/organize-description`: el administrador completa esa ruta automáticamente. Esta configuración nunca debe contener la API key.

## 8. Probar

1. Generá una nueva preview.
2. Abrí el administrador y una propiedad de prueba.
3. En Paso 3 pegá:

   > Chacra de 5 hectáreas en Piriápolis con casa de 3 dormitorios, 2 baños, piscina, barbacoa y vista al mar. Construcción tradicional con aberturas DVH. Se encuentra a pocos minutos de la playa.

4. Pulsá **Organizar descripción** una sola vez.
5. Verificá que aparezcan un título, entre 2 y 4 párrafos y sugerencias basadas únicamente en el texto.
6. Confirmá especialmente que no aparezcan superficies, dormitorios, baños, materiales o servicios no mencionados.
7. Usá **Agregar** solamente en las sugerencias que quieras conservar.

## Seguridad y privacidad

- El Worker acepta únicamente los orígenes definidos en `ALLOWED_ORIGINS`.
- El endpoint sólo recibe descripción, nombre de propiedad y ubicación visible.
- No se envían imágenes, multimedia, tokens de GitHub, claves de Cloudflare ni datos internos del repositorio.
- La respuesta se solicita mediante JSON Schema estricto y vuelve a validarse en el Worker.
- Si OpenAI falla, la propuesta anterior y el texto original permanecen intactos.
- Si la clave no está configurada, el administrador continúa funcionando con la organización básica local.

## Verificaciones técnicas

```powershell
cd workers/ai-text
npm install
npm test
npx wrangler deploy --dry-run
```

Referencias oficiales:

- [Responses API](https://developers.openai.com/api/reference/resources/responses)
- [Modelos de OpenAI](https://developers.openai.com/api/docs/models)
- [Seguridad de API keys](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)

