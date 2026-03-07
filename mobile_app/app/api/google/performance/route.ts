// app/api/google/performance/route.ts

import axios from "axios";
import { globalTokens } from "../../auth/callback/route";

export async function GET() {
  const res = await axios.get(
    "https://businessprofileperformance.googleapis.com/v1/locations/LOCATION_ID/searchKeywords/impressions/monthly",
    {
      headers: {
        Authorization: `Bearer ${globalTokens.access_token}`,
      },
    }
  );

  return Response.json(res.data);
}