# Siddaspace authentication

The Live Projects page is protected by a signed, HTTP-only session cookie. Passwords are stored only as scrypt hashes in the `AUTH_USERS_JSON` environment variable. There is no database in the current project, so users are managed through the deployment environment instead of creating a second database.

## Required environment variables

Set these values in your hosting platform's environment-variable settings and locally before running the site:

```
AUTH_SESSION_SECRET=<a unique random value with at least 32 characters>
AUTH_USERS_JSON=[{"username":"admin","passwordHash":"scrypt$...","role":"admin"}]
```

Do not commit either variable to the repository.

## Create or change a user

Run the following in an interactive terminal. The password is entered without being displayed, and the command prints a password hash only:

```
node scripts/create-user.js admin
```

Copy the resulting JSON object into the `AUTH_USERS_JSON` array. To change a password, run the command again and replace that user's object. To remove a user, remove their object from the array and redeploy or restart the server.

## Local test

Configure the variables for the current terminal, then run `npm start`. Open `/live-projects`. Unauthenticated visitors are sent to `/login?returnTo=%2Flive-projects`. After a successful login they return to `/live-projects`. Use the Logout button to end the session.

## Camera integration

The camera area is only a protected placeholder. Do not place a TrueCloud/TrueView password, RTSP URL, or camera URL in frontend code. The actual integration needs a browser-compatible, authenticated stream or a secure server-side proxy from the camera provider. Confirm the provider's supported web-streaming method before wiring it in.
