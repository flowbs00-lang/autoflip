const JSON_HEADERS = Object.freeze({
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8"
});

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers }
  });
}

export function methodNotAllowed(allowed) {
  return json(
    { ok: false, error: "method_not_allowed" },
    405,
    { Allow: allowed.join(", ") }
  );
}

export function assertSameOrigin(request) {
  const origin = request.headers.get("Origin");
  const expectedOrigin = new URL(request.url).origin;

  return origin === expectedOrigin;
}

export async function readJson(request, maxBytes = 16_384) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new RequestError("content_type", 415);
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > maxBytes) {
    throw new RequestError("payload_too_large", 413);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new RequestError("payload_too_large", 413);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new RequestError("invalid_json", 400);
  }
}

export class RequestError extends Error {
  constructor(code, status = 400) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export function handleError(error) {
  if (error instanceof RequestError) {
    return json({ ok: false, error: error.code }, error.status);
  }

  console.error("Unhandled API error", error);
  return json({ ok: false, error: "internal_error" }, 500);
}
