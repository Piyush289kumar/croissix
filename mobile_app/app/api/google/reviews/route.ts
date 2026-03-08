// mobile_app\app\api\google\reviews\route.ts

import { google } from "googleapis";
import axios from "axios";

export async function GET(req: Request) {
  console.log("----- GOOGLE REVIEWS API START -----");

  try {
    const { searchParams } = new URL(req.url);

    const locationName = searchParams.get("location");
    const token = req.headers.get("authorization");

    console.log("Incoming request URL:", req.url);
    console.log("Location param:", locationName);
    console.log("Authorization header:", token);

    if (!token) {
      console.log("❌ No token provided");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!locationName) {
      console.log("❌ Location missing");
      return Response.json(
        { success: false, error: "Location is required" },
        { status: 400 }
      );
    }

    console.log("🔹 Fetching user profile from backend...");

    const profile = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      {
        headers: { Authorization: token },
      }
    );

    console.log("Profile response:", profile.data);

    const user = profile.data.user;

    console.log("User extracted:", user);

    if (!user.googleAccessToken) {
      console.log("❌ No Google access token stored for user");
      return Response.json(
        { success: false, error: "Google not connected" },
        { status: 401 }
      );
    }

    console.log("🔹 Creating OAuth client");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    console.log("OAuth credentials set");

    console.log("🔹 Fetching Google Business accounts");

    const accountService = google.mybusinessaccountmanagement({
      version: "v1",
      auth: oauth2Client,
    });

    const accountsRes = await accountService.accounts.list({});

    console.log("Accounts response:", accountsRes.data);

    const accountId = accountsRes.data.accounts?.[0]?.name;

    console.log("Account ID:", accountId);

    if (!accountId) {
      console.log("❌ No Google Business account found");
      return Response.json(
        { success: false, error: "No Google Business account found" },
        { status: 404 }
      );
    }

    const locationId = locationName.split("/").pop();

    console.log("Extracted locationId:", locationId);

    const url = `https://mybusiness.googleapis.com/v4/${accountId}/locations/${locationId}/reviews`;

    console.log("Google Reviews API URL:", url);

    console.log("🔹 Calling Google Reviews API...");

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${user.googleAccessToken}`,
      },
    });

    console.log("Google API status:", res.status);

    const data = await res.json();

    console.log("Google Reviews response:", data);

    console.log("----- GOOGLE REVIEWS API SUCCESS -----");

    return Response.json({
      success: true,
      reviews: data.reviews || [],
    });

  } catch (error: any) {
    console.error("🔥 GOOGLE REVIEWS ERROR:", error);

    if (error.response) {
      console.error("Google API Response:", error.response.data);
    }

    return Response.json(
      {
        success: false,
        error: error.message || "Failed to fetch reviews",
      },
      { status: 500 }
    );
  }
}