// mobile_app\app\api\auth\callback\route.ts

import { google } from "googleapis";
import axios from "axios";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");
  const state = searchParams.get("state"); // JWT token
  const token = state ? decodeURIComponent(state) : "";

  if (!code) {
    return new Response("Missing code parameter", { status: 400 });
  }

  // Determine redirect URI dynamically
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? process.env.GOOGLE_REDIRECT_URI
      : "http://localhost:3000/api/auth/callback";

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get Google profile info
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: googleProfile } = await oauth2.userinfo.get();

    // Send Google info to backend to link account
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/link-google`,
      {
        googleId: googleProfile.id,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Redirect back to frontend home or dashboard
    const frontendUrl =
      process.env.NODE_ENV === "production"
        ? "https://croissix.vercel.app"
        : "http://localhost:3000";

    return Response.redirect(frontendUrl);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return new Response("OAuth callback failed", { status: 500 });
  }
}