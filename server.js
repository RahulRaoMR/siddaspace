const http = require("http");
const fs = require("fs");
const path = require("path");
const auth = require("./auth");
const login = require("./api/auth/login");
const logout = require("./api/auth/logout");
const session = require("./api/auth/session");

const rootDir = __dirname;
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm"
};

function resolveRequestPath(url) {
  const requestUrl = new URL(url, `http://localhost:${port}`);
  const decodedPath = decodeURIComponent(requestUrl.pathname);
  const normalizedPath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(rootDir, normalizedPath === path.sep ? "index.html" : normalizedPath);
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(rootDir)) {
    return null;
  }

  return resolvedPath;
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath);
  const candidatePaths = extension ? [filePath] : [
    filePath,
    `${filePath}.html`,
    path.join(filePath, "index.html")
  ];

  const existingPath = candidatePaths.find((candidatePath) => {
    try {
      return fs.statSync(candidatePath).isFile();
    } catch {
      return false;
    }
  });

  if (!existingPath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("404 Not Found");
    return;
  }

  fs.stat(existingPath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("404 Not Found");
      return;
    }

    const contentType = mimeTypes[path.extname(existingPath).toLowerCase()] || "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stats.size
    });
    fs.createReadStream(existingPath).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://localhost:${port}`);
  const pathname = requestUrl.pathname;

  if (pathname === "/api/auth/login") {
    login(request, response);
    return;
  }

  if (pathname === "/api/auth/logout") {
    logout(request, response);
    return;
  }

  if (pathname === "/api/auth/session") {
    session(request, response);
    return;
  }

  if (pathname === "/live-projects" || pathname === "/live-projects.html") {
    if (!auth.getAuthenticatedUser(request)) {
      response.writeHead(302, { Location: "/login?returnTo=%2Flive-projects", "Cache-Control": "no-store" });
      response.end();
      return;
    }

    sendFile(response, path.join(rootDir, "live-projects.html"));
    return;
  }

  if (pathname === "/login") {
    sendFile(response, path.join(rootDir, "login.html"));
    return;
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("405 Method Not Allowed");
    return;
  }

  const filePath = resolveRequestPath(request.url);

  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("403 Forbidden");
    return;
  }

  sendFile(response, filePath);
});

server.listen(port, () => {
  console.log(`Sidda Space website running at http://localhost:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Try: $env:PORT=3001; npm start`);
    process.exit(1);
  }

  throw error;
});
