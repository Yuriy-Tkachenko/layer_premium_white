const http = require("http");
const fs = require("fs");
const path = require("path");

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
