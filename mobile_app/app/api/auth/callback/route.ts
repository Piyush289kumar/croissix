// mobile_app\app\api\auth\callback\route.ts

import { google } from "googleapis";
import axios from "axios";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");
  const token = searchParams.get("state"); // ✅ JWT

  if (!code || !token) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=oauth_failed`,
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  try {
    // STEP 1: exchange code
    const { tokens } = await oauth2Client.getToken(code);

    // STEP 2: get profile
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data: googleProfile } = await oauth2.userinfo.get();

    // STEP 3: send to backend (DB only)
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/link-google`,
      {
        googleId: googleProfile.id,
        email: googleProfile.email,
        name: googleProfile.name,

        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || null,
        googleTokenExpiry: tokens.expiry_date || null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return Response.redirect(process.env.NEXT_PUBLIC_FRONTEND_URL!);
  } catch (error: any) {
    console.error("OAuth Error:", error?.response?.data || error.message);

    return Response.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/login?error=oauth_failed`,
    );
  }
}
