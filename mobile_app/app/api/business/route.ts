import { google } from "googleapis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const access_token = searchParams.get("access_token");

  if (!access_token) return Response.json({ error: "No access token" });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token });

  const business = google.mybusinessaccountmanagement({
    version: "v1",
    auth: oauth2Client,
  });

  try {
    const accounts = await business.accounts.list();

    return Response.json(accounts.data);
  } catch (error: any) {
    return Response.json({ error: error.message });
  }
}