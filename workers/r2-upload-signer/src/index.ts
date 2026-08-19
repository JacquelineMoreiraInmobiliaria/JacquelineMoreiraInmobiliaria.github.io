import { AwsClient } from "aws4fetch";

interface Env { R2_ACCOUNT_ID: string; R2_ACCESS_KEY_ID: string; R2_SECRET_ACCESS_KEY: string; R2_BUCKET_NAME: string; R2_PUBLIC_BASE_URL: string; ALLOWED_ORIGINS?: string; }
const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4" };
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const cors = (origin: string | null, env: Env) => { const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((item) => item.trim()); return origin && allowed.includes(origin) ? { "access-control-allow-origin": origin, "vary": "Origin", "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "Content-Type" } : {}; };
const json = (body: unknown, origin: string | null, env: Env, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors(origin, env) } });
export default { async fetch(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") return new Response(null, { headers: cors(origin, env) });
  if (request.method !== "POST" || new URL(request.url).pathname !== "/upload-url") return json({ error: "No encontrado." }, origin, env, 404);
  if (!origin || !Object.keys(cors(origin, env)).length) return json({ error: "Origen no autorizado." }, origin, env, 403);
  try {
    const { slug, kind, contentType, id } = await request.json() as {slug?: string; kind?: string; contentType?: string; id?: string};
    if (!slug || !validSlug.test(slug) || !contentType || !types[contentType]) return json({ error: "Solicitud de carga inválida." }, origin, env, 400);
    const ext = types[contentType];
    if ((kind === "cover" && !contentType.startsWith("image/")) || (kind === "video" && contentType !== "video/mp4") || (kind === "gallery" && (!id || !/^[a-zA-Z0-9-]{20,80}$/.test(id)))) return json({ error: "Tipo de archivo inválido." }, origin, env, 400);
    const key = kind === "cover" ? `propiedades/${slug}/portada.${ext}` : kind === "video" ? `propiedades/${slug}/video.mp4` : `propiedades/${slug}/galeria/${id}.${ext}`;
    const client = new AwsClient({ accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY });
    const endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${key}?X-Amz-Expires=600`;
    const signed = await client.sign(new Request(endpoint, { method: "PUT", headers: { "Content-Type": contentType } }), { aws: { signQuery: true, service: "s3", region: "auto" } });
    return json({ uploadUrl: signed.url, publicUrl: env.R2_PUBLIC_BASE_URL.replace(/\/$/, "") + "/" + key, key, expiresIn: 600 }, origin, env);
  } catch { return json({ error: "No se pudo preparar la carga." }, origin, env, 500); }
} };
