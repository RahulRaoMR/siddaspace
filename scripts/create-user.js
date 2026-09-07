const crypto = require("crypto");

const username = process.argv[2]?.trim();

if (!username || !/^[a-zA-Z0-9._-]{3,80}$/.test(username)) {
  console.error("Usage: node scripts/create-user.js <username>");
  process.exit(1);
}

if (!process.stdin.isTTY) {
  console.error("Run this command in an interactive terminal to enter a password securely.");
  process.exit(1);
}

function promptForPassword() {
  return new Promise((resolve) => {
    let password = "";
    process.stdout.write("Password: ");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk) => {
      for (const character of chunk) {
        if (character === "\r" || character === "\n") {
          process.stdout.write("\n");
          process.stdin.setRawMode(false);
          process.stdin.pause();
          resolve(password);
          return;
        }

        if (character === "\u0003") {
          process.exit(130);
        }

        if (character === "\u007f" || character === "\b") {
          password = password.slice(0, -1);
          continue;
        }

        password += character;
      }
    });
  });
}

(async () => {
  const password = await promptForPassword();

  if (password.length < 12) {
    console.error("Use a password with at least 12 characters.");
    process.exit(1);
  }

  const salt = crypto.randomBytes(16).toString("base64url");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("base64url");
  console.log(JSON.stringify({ username, passwordHash: `scrypt$${salt}$${derivedKey}`, role: "admin" }));
})();
