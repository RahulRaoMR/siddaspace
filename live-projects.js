const logoutButton = document.querySelector("[data-auth-logout]");

logoutButton?.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" }
    });
  } finally {
    window.location.assign("/login");
  }
});
