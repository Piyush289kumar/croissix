// app/api/google/reply/route.ts

import { getAuthClient } from "@/lib/googleAuth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { reviewName, comment } = body;

    if (!reviewName || !comment) {
      return Response.json(
        { success: false, error: "reviewName and comment are required" },
        { status: 400 },
      );
    }

    // ✅ STEP 1: Get Authorization header
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return Response.json(
        { success: false, error: "Missing Authorization header" },
        { status: 401 },
      );
    }

    // ✅ STEP 2: Get Google client (DB-based)
    const client = await getAuthClient(authHeader);

    if (!client) {
      return Response.json(
        { success: false, error: "Google authentication failed" },
        { status: 401 },
      );
    }

    // ✅ STEP 3: Use Google client (AUTO refresh handled)
    const response = await client.request({
      url: `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
      method: "PUT",
      data: { comment },
    });

    return Response.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    console.error("❌ Reply Error:", error?.response?.data || error.message);

    return Response.json(
      {
        success: false,
        error: error?.response?.data || error.message || "Failed to reply",
      },
      { status: 500 },
    );
  }
}
