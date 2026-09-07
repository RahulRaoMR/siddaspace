const crypto = require("crypto");

const SESSION_COOKIE = "sidda_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map();

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be configured with at least 32 characters.");
  }

  return secret;
}

function getUsers() {
  const rawUsers = process.env.AUTH_USERS_JSON;

  if (!rawUsers) {
    throw new Error("AUTH_USERS_JSON is not configured.");
  }

  let users;

  try {
    users = JSON.parse(rawUsers);
  } catch {
    throw new Error("AUTH_USERS_JSON must be valid JSON.");
  }

  if (!Array.isArray(users) || users.length === 0) {
    throw new Error("AUTH_USERS_JSON must contain at least one user.");
  }

  return users.filter((user) => user && typeof user.username === "string" && typeof user.passwordHash === "string");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("base64url")) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${derivedKey}`;
}

function verifyPassword(password, passwordHash) {
  const [scheme, salt, expectedKey] = passwordHash.split("$");

  if (scheme !== "scrypt" || !salt || !expectedKey) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, 64).toString("base64url");
  const expectedBuffer = Buffer.from(expectedKey);
  const actualBuffer = Buffer.from(derivedKey);

  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function sign(value) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function createSession(username) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(JSON.stringify({ sub: username, iat: now, exp: now + SESSION_TTL_SECONDS }));
  return `${payload}.${sign(payload)}`;
}

function parseCookies(header = "") {
  return header.split(";").reduce((cookies, item) => {
    const separatorIndex = item.indexOf("=");

    if (separatorIndex > -1) {
      cookies[item.slice(0, separatorIndex).trim()] = item.slice(separatorIndex + 1).trim();
    }

    return cookies;
  }, {});
}

function getAuthenticatedUser(request) {
  try {
    const session = parseCookies(request.headers.cookie)[SESSION_COOKIE];

    if (!session) {
      return null;
    }

    const [payload, signature] = session.split(".");
    const expectedSignature = sign(payload);

    if (!payload || !signature || signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (!claims.sub || !claims.exp || claims.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return getUsers().find((user) => user.username === claims.sub) || null;
  } catch {
    return null;
  }
}

function isSecureEnvironment() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
}

function sessionCookie(session) {
  const parts = [`${SESSION_COOKIE}=${session}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${SESSION_TTL_SECONDS}`];

  if (isSecureEnvironment()) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function clearSessionCookie() {
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];

  if (isSecureEnvironment()) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function getClientAddress(request) {
  const forwarded = request.headers["x-forwarded-for"];
  return typeof forwarded === "string" ? forwarded.split(",")[0].trim() : request.socket?.remoteAddress || "unknown";
}

function isRateLimited(request) {
  const address = getClientAddress(request);
  const now = Date.now();
  const attempt = loginAttempts.get(address);

  if (!attempt || now - attempt.startedAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(address, { startedAt: now, count: 1 });
    return false;
  }

  attempt.count += 1;
  return attempt.count > MAX_LOGIN_ATTEMPTS;
}

function clearLoginAttempts(request) {
  loginAttempts.delete(getClientAddress(request));
}

function sendJson(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  response.end(JSON.stringify(body));
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000) {
        reject(new Error("Request body too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

module.exports = {
  clearLoginAttempts,
  clearSessionCookie,
  createSession,
  getAuthenticatedUser,
  getUsers,
  hashPassword,
  isRateLimited,
  readJsonBody,
  sendJson,
  sessionCookie,
  verifyPassword
};
