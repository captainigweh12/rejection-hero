import { Hono } from "hono";
import { type AppType } from "../types";

const webRedirectRouter = new Hono<AppType>();

// ============================================
// GET /reset-password - Web redirect page for password reset
// ============================================
webRedirectRouter.get("/reset-password", async (c) => {
  const token = c.req.query("token");
  const email = c.req.query("email");

  if (!token || !email) {
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invalid Reset Link</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0A0A0F 0%, #1A1A24 50%, #2A1A34 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
          }
          h1 { font-size: 24px; margin-bottom: 16px; }
          p { font-size: 16px; opacity: 0.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Invalid Reset Link</h1>
          <p>The password reset link is invalid or missing required parameters.</p>
        </div>
      </body>
      </html>
    `, 400);
  }

  // Redirect to app with deep link
  const appDeepLink = `vibecode://reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const fallbackUrl = `https://rejectionhero.com/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password - Rejection Hero</title>
      <meta http-equiv="refresh" content="2;url=${appDeepLink}">
      <script>
        // Try to open app immediately
        window.location.href = "${appDeepLink}";
      </script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #0A0A0F 0%, #1A1A24 50%, #2A1A34 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          max-width: 500px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          background: linear-gradient(135deg, #7E3FE4 0%, #00D9FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
        }
        h1 { font-size: 24px; margin-bottom: 16px; }
        p { font-size: 16px; opacity: 0.8; margin-bottom: 24px; }
        .spinner {
          border: 3px solid rgba(126, 63, 228, 0.3);
          border-top: 3px solid #7E3FE4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #7E3FE4 0%, #5E1FA8 100%);
          color: white;
          padding: 14px 32px;
          border-radius: 24px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🎯 Rejection Hero</div>
        <h1>Redirecting to App...</h1>
        <p>Opening the Rejection Hero app to reset your password.</p>
        <div class="spinner"></div>
        <p style="font-size: 14px; opacity: 0.6;">If the app doesn't open automatically, click below:</p>
        <a href="${appDeepLink}" class="button">Open in App</a>
        <script>
          // Try to open app immediately
          window.location.href = "${appDeepLink}";
          
          // Fallback: if app doesn't open in 2 seconds, show manual link
          setTimeout(function() {
            document.querySelector('.button').style.display = 'inline-block';
          }, 2000);
        </script>
      </div>
    </body>
    </html>
  `);
});

// ============================================
// GET /accept-invite - Web redirect page for group invites
// ============================================
webRedirectRouter.get("/accept-invite", async (c) => {
  const groupId = c.req.query("groupId");
  const email = c.req.query("email");

  if (!groupId || !email) {
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invalid Invite Link</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0A0A0F 0%, #1A1A24 50%, #2A1A34 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 40px;
          }
          h1 { font-size: 24px; margin-bottom: 16px; }
          p { font-size: 16px; opacity: 0.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Invalid Invite Link</h1>
          <p>The invite link is invalid or missing required parameters.</p>
        </div>
      </body>
      </html>
    `, 400);
  }

  // Redirect to app with deep link
  const appDeepLink = `vibecode://group-invite?groupId=${encodeURIComponent(groupId)}&email=${encodeURIComponent(email)}`;

  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Group Invite - Rejection Hero</title>
      <meta http-equiv="refresh" content="2;url=${appDeepLink}">
      <script>
        // Try to open app immediately
        window.location.href = "${appDeepLink}";
      </script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #0A0A0F 0%, #1A1A24 50%, #2A1A34 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          max-width: 500px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          background: linear-gradient(135deg, #7E3FE4 0%, #00D9FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
        }
        h1 { font-size: 24px; margin-bottom: 16px; }
        p { font-size: 16px; opacity: 0.8; margin-bottom: 24px; }
        .spinner {
          border: 3px solid rgba(126, 63, 228, 0.3);
          border-top: 3px solid #7E3FE4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #7E3FE4 0%, #5E1FA8 100%);
          color: white;
          padding: 14px 32px;
          border-radius: 24px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🎯 Rejection Hero</div>
        <h1>Redirecting to App...</h1>
        <p>Opening the Rejection Hero app to accept the group invite.</p>
        <div class="spinner"></div>
        <p style="font-size: 14px; opacity: 0.6;">If the app doesn't open automatically, click below:</p>
        <a href="${appDeepLink}" class="button">Open in App</a>
        <script>
          // Try to open app immediately
          window.location.href = "${appDeepLink}";
          
          // Fallback: if app doesn't open in 2 seconds, show manual link
          setTimeout(function() {
            document.querySelector('.button').style.display = 'inline-block';
          }, 2000);
        </script>
      </div>
    </body>
    </html>
  `);
});

// ============================================
// GET /invite - Web redirect page for friend invites
// ============================================
webRedirectRouter.get("/invite", async (c) => {
  // Redirect to app with deep link
  const appDeepLink = `vibecode://home`;

  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Join Rejection Hero</title>
      <meta http-equiv="refresh" content="2;url=${appDeepLink}">
      <script>
        // Try to open app immediately
        window.location.href = "${appDeepLink}";
      </script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #0A0A0F 0%, #1A1A24 50%, #2A1A34 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          max-width: 500px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          background: linear-gradient(135deg, #7E3FE4 0%, #00D9FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
        }
        h1 { font-size: 24px; margin-bottom: 16px; }
        p { font-size: 16px; opacity: 0.8; margin-bottom: 24px; }
        .spinner {
          border: 3px solid rgba(126, 63, 228, 0.3);
          border-top: 3px solid #7E3FE4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #7E3FE4 0%, #5E1FA8 100%);
          color: white;
          padding: 14px 32px;
          border-radius: 24px;
          text-decoration: none;
          font-weight: bold;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🎯 Rejection Hero</div>
        <h1>Join Rejection Hero!</h1>
        <p>You've been invited to join Rejection Hero. Opening the app now...</p>
        <div class="spinner"></div>
        <p style="font-size: 14px; opacity: 0.6;">If the app doesn't open automatically, click below:</p>
        <a href="${appDeepLink}" class="button">Open in App</a>
        <script>
          // Try to open app immediately
          window.location.href = "${appDeepLink}";
          
          // Fallback: if app doesn't open in 2 seconds, show manual link
          setTimeout(function() {
            document.querySelector('.button').style.display = 'inline-block';
          }, 2000);
        </script>
      </div>
    </body>
    </html>
  `);
});

export { webRedirectRouter };

