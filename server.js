const http = require("http");
const fs = require("fs");
const path = require("path");
const auth = require("./auth");
const login = require("./api/auth/login");
const logout = require("./api/auth/logout");
const session = require("./api/auth/session");
const liveProjects = require("./api/live-projects");

const rootDir = __dirname;
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
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

function sendFile(response, filePath, request, statusCode = 200) {
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
    if (statusCode !== 404 && fs.existsSync(path.join(rootDir, "404.html"))) {
      response.setHeader("X-Robots-Tag", "noindex, follow");
      sendFile(response, path.join(rootDir, "404.html"), request, 404);
      return;
    }
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
    const isVideo = /\.(mp4|webm)$/i.test(existingPath);
    const range = isVideo && request?.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = Number(range[1]);
      const end = range[2] ? Math.min(Number(range[2]), stats.size - 1) : stats.size - 1;
      if (start > end || start >= stats.size) {
        response.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
        response.end();
        return;
      }
      response.writeHead(206, { "Content-Type": contentType, "Content-Length": end - start + 1, "Content-Range": `bytes ${start}-${end}/${stats.size}`, "Accept-Ranges": "bytes" });
      if (request.method === "HEAD") response.end();
      else fs.createReadStream(existingPath, { start, end }).pipe(response);
      return;
    }
    response.writeHead(statusCode, {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      ...(isVideo ? { "Accept-Ranges": "bytes" } : {}),
      ...(existingPath.includes(`${path.sep}optimized${path.sep}`) ? { "Cache-Control": "public, max-age=31536000, immutable" } : {})
    });
    if (request?.method === "HEAD") response.end();
    else fs.createReadStream(existingPath).pipe(response);
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://localhost:${port}`);
  let pathname;
  try {
    pathname = path.posix.normalize(decodeURIComponent(requestUrl.pathname).replace(/\\/g, "/"));
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Invalid URL");
    return;
  }
  if (/^\/(?:api\/|login(?:\.html)?$|live-projects(?:\.html)?$|scripts\/|reports\/|SEO\.md$)/.test(pathname)) {
    response.setHeader("X-Robots-Tag", "noindex, nofollow");
  }

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

  if (pathname === "/api/live-projects") {
    liveProjects(request, response);
    return;
  }

  if (pathname === "/live-projects" || pathname === "/live-projects.html") {
    if (!auth.getAuthenticatedUser(request)) {
      response.writeHead(302, { Location: "/login?returnTo=%2Flive-projects", "Cache-Control": "no-store" });
      response.end();
      return;
    }

    response.setHeader("Cache-Control", "private, no-store");
    sendFile(response, path.join(rootDir, "live-projects.html"), request);
    return;
  }

  if (pathname === "/login") {
    sendFile(response, path.join(rootDir, "login.html"), request);
    return;
  }

  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("405 Method Not Allowed");
    return;
  }

  if (pathname === "/presentation" || pathname === "/presentation.html") {
    response.writeHead(308, { Location: "/products" });
    response.end();
    return;
  }
  if (pathname.endsWith(".html") || (pathname.length > 1 && pathname.endsWith("/")) || pathname === "/index") {
    let destination = pathname.replace(/\.html$/, "").replace(/\/+$/, "");
    if (destination === "/index") destination = "/";
    const candidate = path.join(rootDir, destination === "/" ? "index.html" : `${destination}.html`);
    if (fs.existsSync(candidate)) {
      response.writeHead(308, { Location: destination + requestUrl.search });
      response.end();
      return;
    }
  }

  const filePath = resolveRequestPath(request.url);

  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("403 Forbidden");
    return;
  }

  sendFile(response, filePath, request);
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
