const loginForm = document.querySelector("[data-login-form]");
const loginError = document.querySelector("[data-login-error]");

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const submitButton = loginForm.querySelector("button[type='submit']");

  loginError.hidden = true;
  submitButton.disabled = true;
  submitButton.textContent = "Logging in...";

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
        returnTo: "/live-projects"
      })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to log in.");
    }

    window.location.assign(result.redirectTo || "/live-projects");
  } catch (error) {
    loginError.textContent = error.message;
    loginError.hidden = false;
    submitButton.disabled = false;
    submitButton.textContent = "Log In";
  }
});
