// mobile_app\app\api\auth\callback\route.ts

import { google } from "googleapis";
import axios from "axios";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");
  const token = searchParams.get("state");

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const { tokens } = await oauth2Client.getToken(code as string);

  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: "v2",
  });

  const { data: googleProfile } = await oauth2.userinfo.get();

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

  return Response.redirect("http://localhost:3000/");
}