// mobile_app\app\api\google\accounts\route.ts

import { google } from "googleapis";
import { getAuthClient } from "@/lib/googleAuth";

export async function GET() {
  const auth = getAuthClient();

  const service = google.mybusinessaccountmanagement({
    version: "v1",
    auth,
  });

  const res = await service.accounts.list();

  return Response.json(res.data);
}