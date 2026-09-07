const auth = require("../../auth");

module.exports = async function login(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    auth.sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  if (request.headers["content-type"]?.split(";")[0] !== "application/json") {
    auth.sendJson(response, 415, { error: "Unsupported request format." });
    return;
  }

  if (auth.isRateLimited(request)) {
    auth.sendJson(response, 429, { error: "Too many login attempts. Please try again later." });
    return;
  }

  try {
    const body = await auth.readJsonBody(request);
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const user = auth.getUsers().find((candidate) => candidate.username === username);

    if (!user || !auth.verifyPassword(password, user.passwordHash)) {
      auth.sendJson(response, 401, { error: "Invalid username or password." });
      return;
    }

    auth.clearLoginAttempts(request);
    auth.sendJson(response, 200, { redirectTo: "/live-projects" }, {
      "Set-Cookie": auth.sessionCookie(auth.createSession(user.username))
    });
  } catch (error) {
    const invalidRequest = error.message === "Invalid JSON body." || error.message === "Request body too large.";
    auth.sendJson(response, invalidRequest ? 400 : 503, {
      error: invalidRequest ? "Unable to process this login request." : "Login is not configured yet."
    });
  }
};
