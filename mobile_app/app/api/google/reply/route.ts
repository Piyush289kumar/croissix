// app/api/google/reply/route.ts

import { getAuthClient } from "@/lib/googleAuth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reviewName, comment } = body;

    if (!reviewName || !comment) {
      return Response.json(
        { success: false, error: "reviewName and comment are required" },
        { status: 400 }
      );
    }

    const auth = await getAuthClient();
    if (!auth) {
      return Response.json(
        { success: false, error: "Google authentication failed" },
        { status: 401 }
      );
    }

    const url = `https://mybusiness.googleapis.com/v4/${reviewName}/reply`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.credentials.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment }),
    });

    const data = await res.json();

    return Response.json({
      success: true,
      data,
    });

  } catch (error: any) {
    console.error("Reply Error:", error);

    return Response.json(
      {
        success: false,
        error: error.message || "Failed to reply to review",
      },
      { status: 500 }
    );
  }
}