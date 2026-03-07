// mobile_app\lib\googleAuth.ts

import { google } from "googleapis";
import { cookies } from "next/headers";

export async function getAuthClient() {
  const tokenCookie = (await cookies()).get("google_tokens");
  if (!tokenCookie) return null;

  const tokens = JSON.parse(tokenCookie.value);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials(tokens);

  // 🔥 Auto refresh if expired
  if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
    const { credentials } = await oauth2Client.refreshAccessToken();

    (await cookies()).set("google_tokens", JSON.stringify(credentials), {
      httpOnly: true,
    });

    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}