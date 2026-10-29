# Multimedia directa con Cloudflare R2

Esta integración guarda **solo fotos y videos** en R2. El código y los datos YAML siguen en GitHub. No hay claves secretas en el administrador.

## 1. Crear bucket y dominio público
En Cloudflare: **R2 > Create bucket**. Elegí un nombre como `moreira-media`, y conectá un dominio público para el bucket, por ejemplo `https://media.ejemplo.com`.

## 2. CORS del bucket
En R2 > bucket > Settings > CORS:

```json
[{"AllowedOrigins":["https://jacquelinemoreirainmobiliaria.github.io","http://localhost:4321"],"AllowedMethods":["PUT"],"AllowedHeaders":["Content-Type"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":600}]
```

No usar `*` para escrituras.

## 3. Credenciales limitadas
Crear un token R2 con **Object Read & Write** limitado a ese bucket. Guardar Account ID, Access Key ID y Secret Access Key; nunca copiarlos al repositorio o al navegador.

## 4. Worker
En `workers/r2-upload-signer/`:

```bash
npm install
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET_NAME
npx wrangler secret put R2_PUBLIC_BASE_URL
npm run deploy
```

El Worker acepta solo `POST /upload-url`, valida slug, tipo y clave exacta, y devuelve un PUT presignado de 10 minutos. El archivo va del navegador directamente a R2.

## 5. Conectar el administrador
Editar `public/config/r2-upload.js` con la URL pública del Worker (no es un secreto):

```js
window.MOREIRA_R2_UPLOAD = { workerUrl: "https://TU-WORKER.workers.dev", maxImageBytes: 26214400, maxVideoBytes: 262144000 };
```

## 6. Prueba
Subir una foto de prueba. Las claves serán:

```
propiedades/<slug>/portada.<ext>
propiedades/<slug>/galeria/<uuid>.<ext>
propiedades/<slug>/video.mp4
```

El orden y las descripciones se guardan en el YAML, no en el nombre del archivo. Si R2 no está configurado, sigue disponible el flujo manual.
