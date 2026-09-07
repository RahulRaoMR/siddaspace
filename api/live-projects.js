const fs = require("fs");
const path = require("path");
const auth = require("../auth");

module.exports = function liveProjects(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("405 Method Not Allowed");
    return;
  }

  if (!auth.getAuthenticatedUser(request)) {
    response.writeHead(302, { Location: "/login?returnTo=%2Flive-projects", "Cache-Control": "no-store" });
    response.end();
    return;
  }

  fs.readFile(path.join(process.cwd(), "live-projects.html"), (error, page) => {
    if (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Unable to load Live Projects.");
      return;
    }

    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "Content-Length": page.length });
    response.end(request.method === "HEAD" ? undefined : page);
  });
};
