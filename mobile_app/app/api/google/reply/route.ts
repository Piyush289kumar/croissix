// app/api/google/reply/route.ts

import axios from "axios";
import { getAuthClient } from "@/app/lib/googleAuth";
import { google } from "googleapis";

export async function POST(req: Request) {
  const { reviewName, comment } = await req.json();
  // reviewName example:
  // accounts/123456/locations/78910/reviews/111213

  if (!reviewName || !comment) {
    return Response.json({ error: "Missing data" }, { status: 400 });
  }

  try {
    const auth = await getAuthClient();
    if (!auth) {
      return Response.json({ error: "Authentication failed" }, { status: 401 });
    }

    const accessToken = auth.credentials.access_token;

    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;

    const res = await axios.put(
      url,
      { comment },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return Response.json(res.data);

  } catch (error: any) {
    console.error("Reply error:", error.response?.data || error);
    return Response.json(
      { error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}