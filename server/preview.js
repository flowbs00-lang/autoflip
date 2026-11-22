import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../cloudflare/app");
function argument(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}
const host = argument("--host", "127.0.0.1");
const port = Number(argument("--port", "4173"));
const types = new Map([[".css", "text/css; charset=utf-8"], [".html", "text/html; charset=utf-8"], [".js", "text/javascript; charset=utf-8"], [".png", "image/png"], [".webp", "image/webp"], [".svg", "image/svg+xml"]]);

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const relative = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname).replace(/^\/+/, "");
    let filename = path.resolve(root, relative);
    if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) throw Object.assign(new Error("Not found"), { code: "ENOENT" });
    const info = await stat(filename);
    if (info.isDirectory()) filename = path.join(filename, "index.html");
    const body = await readFile(filename);
    response.writeHead(200, { "Cache-Control": "no-store", "Content-Type": types.get(path.extname(filename)) || "application/octet-stream" });
    response.end(body);
  } catch (error) {
    response.writeHead(error?.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error?.code === "ENOENT" ? "Not Found" : "Preview error");
  }
}).listen(port, host, () => console.log(`AutoFlip preview listening on http://${host}:${port}`));
