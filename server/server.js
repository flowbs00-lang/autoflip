import { createServer } from "node:http";
import { Readable } from "node:stream";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openDatabase } from "./db.js";
import { apiRoutes } from "./routes.js";
import { onRequest as middleware } from "../functions/_middleware.js";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(serverDirectory, "..");
const publicDirectory = path.join(projectDirectory, "cloudflare");
const migrationsDirectory = path.join(publicDirectory, "migrations");
const databasePath = path.resolve(process.env.DATABASE_PATH || path.join(projectDirectory, "data", "autoflip.sqlite3"));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"]
]);

const db = await openDatabase({ filename: databasePath, migrationsDirectory });
const env = { ...process.env, DB: db };

function externalUrl(request) {
  const protocol = String(request.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
  const hostHeader = request.headers.host || `localhost:${port}`;
  return `${protocol}://${hostHeader}${request.url || "/"}`;
}

function webRequest(request) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, value);
  }
  if (!headers.has("CF-Connecting-IP")) {
    const forwarded = String(headers.get("X-Forwarded-For") || request.socket.remoteAddress || "").split(",")[0].trim();
    if (forwarded) headers.set("CF-Connecting-IP", forwarded);
  }

  const method = request.method || "GET";
  const init = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.body = Readable.toWeb(request);
    init.duplex = "half";
  }
  return new Request(externalUrl(request), init);
}

function cacheControl(filename) {
  return filename.endsWith(".html") ? "no-store" : "public, max-age=3600";
}

async function staticResponse(request) {
  const url = new URL(request.url);
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (pathname === "/health") {
    return Response.json({ ok: true, service: "autoflip", database: "sqlite" }, {
      headers: { "Cache-Control": "no-store" }
    });
  }

  if (pathname === "/" || pathname === "/index.html") {
    return Response.redirect(`${url.origin}/login/`, 302);
  }

  let relative = pathname.replace(/^\/+/, "");
  if (!relative || pathname.endsWith("/")) relative = path.join(relative, "index.html");
  const filename = path.resolve(publicDirectory, relative);
  if (filename !== publicDirectory && !filename.startsWith(`${publicDirectory}${path.sep}`)) {
    return new Response("Not Found", { status: 404 });
  }
  if (filename.includes(`${path.sep}node_modules${path.sep}`) || filename.includes(`${path.sep}migrations${path.sep}`) || filename.includes(`${path.sep}src${path.sep}`)) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    await access(filename);
    const fileStat = await stat(filename);
    if (fileStat.isDirectory() && !pathname.endsWith("/")) {
      // OAuth providers append short-lived verification parameters to the
      // callback URL. Preserve them when normalizing directory URLs, otherwise
      // the VK ID callback reaches the browser without its code and state.
      return Response.redirect(`${url.origin}${pathname}/${url.search}`, 302);
    }
    if (!fileStat.isFile()) return new Response("Not Found", { status: 404 });
    const body = request.method === "HEAD" ? null : await readFile(filename);
    return new Response(body, {
      headers: {
        "Cache-Control": cacheControl(filename),
        "Content-Length": String(fileStat.size),
        "Content-Type": MIME_TYPES.get(path.extname(filename).toLowerCase()) || "application/octet-stream"
      }
    });
  } catch (error) {
    if (error?.code === "ENOENT") return new Response("Not Found", { status: 404 });
    throw error;
  }
}

async function applicationResponse(request) {
  const url = new URL(request.url);
  const handler = apiRoutes.get(url.pathname);
  if (url.pathname.startsWith("/api/") && !handler) {
    return Response.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const context = {
    request,
    env,
    data: {},
    next: () => handler ? handler(context) : staticResponse(request),
    waitUntil(promise) {
      Promise.resolve(promise).catch((error) => console.error("Background task failed", error));
    }
  };
  return middleware(context);
}

async function send(response, outgoing) {
  outgoing.statusCode = response.status;
  outgoing.statusMessage = response.statusText;
  for (const [name, value] of response.headers) {
    if (name.toLowerCase() !== "set-cookie") outgoing.setHeader(name, value);
  }
  const cookies = response.headers.getSetCookie?.() || [];
  if (!cookies.length) {
    const cookie = response.headers.get("set-cookie");
    if (cookie) cookies.push(cookie);
  }
  if (cookies.length) outgoing.setHeader("Set-Cookie", cookies);
  if (!response.body) return outgoing.end();
  Readable.fromWeb(response.body).pipe(outgoing);
}

const server = createServer(async (incoming, outgoing) => {
  try {
    await send(await applicationResponse(webRequest(incoming)), outgoing);
  } catch (error) {
    console.error("Request failed", error);
    if (!outgoing.headersSent) {
      outgoing.statusCode = 500;
      outgoing.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    outgoing.end(JSON.stringify({ ok: false, error: "internal_error" }));
  }
});

server.listen(port, host, () => {
  console.log(`AutoFlip listening on http://${host}:${port}`);
  console.log(`SQLite database: ${databasePath}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
