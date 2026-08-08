const http = require("http");
const fs = require("fs");
const path = require("path");

const envFile = path.resolve(__dirname, "../../.env.local");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const separator = line.indexOf("=");
      if (separator < 1 || line.trimStart().startsWith("#")) return;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    });
}

const contactHandler = require("../../api/contact.js");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
};

http
  .createServer((request, response) => {
    const pathname = decodeURIComponent(request.url.split("?")[0]);

    if (pathname === "/api/contact") {
      contactHandler(request, response);
      return;
    }

    const relativePath =
      pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filePath = path.resolve(root, relativePath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response
          .writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
          .end("Not found");
        return;
      }
      response
        .writeHead(200, {
          "Content-Type":
            types[path.extname(filePath)] || "application/octet-stream",
        })
        .end(data);
    });
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Local server: http://127.0.0.1:${port}/`);
  });
