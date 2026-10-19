// Optional local QA/media tooling. Uses an installed browser; no npm dependency.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function withBrowser(work) {
  const executable = [process.env.SIDDA_BROWSER_PATH,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe"
  ].find(file => file && fs.existsSync(file));
  if (!executable) throw new Error("Set SIDDA_BROWSER_PATH to an installed Chromium browser for optional browser checks.");
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "siddaspace-qa-"));
  const browser = spawn(executable, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`,
    "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-sync", "--disable-extensions", "--disable-gpu", "about:blank"
  ], { windowsHide: true, stdio: ["ignore", "ignore", "ignore"] });
  let socket;
  try {
    const portFile = path.join(profile, "DevToolsActivePort");
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await pause(100);
    if (!fs.existsSync(portFile)) throw new Error("Headless browser did not start.");
    const port = fs.readFileSync(portFile, "utf8").split("\n")[0];
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    let sequence = 0;
    const pending = new Map();
    const listeners = new Set();
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      const callback = pending.get(message.id);
      if (callback) {
        pending.delete(message.id); clearTimeout(callback.timer);
        if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
        else callback.resolve(message.result);
      } else for (const listener of listeners) listener(message);
    };
    const call = (method, params = {}, timeoutMs = 30000) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Browser timeout: ${method}`)); }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression, timeoutMs = 30000) => {
      const result = await call("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }, timeoutMs);
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result?.value;
    };
    await call("Page.enable"); await call("Runtime.enable"); await call("Network.enable");
    return await work({ call, evaluate, pause, onEvent: listener => listeners.add(listener), profile });
  } finally {
    socket?.close(); browser.kill();
  }
}
module.exports = { withBrowser };
