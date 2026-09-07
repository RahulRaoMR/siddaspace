const auth = require("../../auth");

module.exports = function logout(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    auth.sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  auth.sendJson(response, 200, { ok: true }, { "Set-Cookie": auth.clearSessionCookie() });
};
