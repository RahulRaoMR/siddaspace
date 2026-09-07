const auth = require("../../auth");

module.exports = function session(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    auth.sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const user = auth.getAuthenticatedUser(request);
  auth.sendJson(response, 200, { authenticated: Boolean(user), user: user ? { username: user.username, role: user.role || "user" } : null });
};
