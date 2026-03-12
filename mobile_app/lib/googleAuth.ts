// mobile_app\lib\googleAuth.ts

// import { google } from "googleapis";
// import { cookies } from "next/headers";

// export async function getAuthClient() {
//   const tokenCookie = (await cookies()).get("google_tokens");
//   if (!tokenCookie) return null;

//   const tokens = JSON.parse(tokenCookie.value);

//   const oauth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET
//   );

//   oauth2Client.setCredentials(tokens);

//   // 🔥 Auto refresh if expired
//   if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
//     const { credentials } = await oauth2Client.refreshAccessToken();

//     (await cookies()).set("google_tokens", JSON.stringify(credentials), {
//       httpOnly: true,
//     });

//     oauth2Client.setCredentials(credentials);
//   }

//   return oauth2Client;
// }

// LOG

import { google } from "googleapis";
import { cookies } from "next/headers";

export async function getAuthClient() {
  console.log("===== GOOGLE AUTH START =====");

  const cookieStore = await cookies();

  const tokenCookie = cookieStore.get("google_tokens");

  console.log("Cookie Found:", !!tokenCookie);

  if (!tokenCookie) {
    console.log("❌ No google_tokens cookie");
    return null;
  }

  const tokens = JSON.parse(tokenCookie.value);

  console.log("Tokens:", tokens);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials(tokens);

  console.log("OAuth client credentials set");

  // Check expiration
  if (tokens.expiry_date) {
    console.log("Token Expiry:", new Date(tokens.expiry_date));
    console.log("Current Time:", new Date());
  }

  // Refresh if expired
  if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
    console.log("⚠️ Token expired — refreshing");

    const { credentials } = await oauth2Client.refreshAccessToken();

    console.log("New Credentials:", credentials);

    cookieStore.set("google_tokens", JSON.stringify(credentials), {
      httpOnly: true,
    });

    oauth2Client.setCredentials(credentials);
  }

  console.log("✅ Auth client ready");

  return oauth2Client;
}
