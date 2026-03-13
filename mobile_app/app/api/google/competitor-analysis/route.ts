// mobile_app\app\api\google\competitor-analysis\route.ts

// mobile_app/app/api/google/competitor-analysis/route.ts
//
// Returns nearby competitors from Google Places API compared against
// the logged-in user's own GBP location data.
//
// Strategy:
//  1. Fetch user's own GBP location (name, coords, category, rating, reviews)
//  2. Use Google Places Nearby Search to find same-category businesses within radius
//  3. Fetch Place Details for each competitor (rating, user_ratings_total, opening_hours etc.)
//  4. Rank all businesses (user + competitors) by a composite score
//  5. Return ranked list with user's position highlighted
//
// Composite rank score = (avgRating × 0.5) + (log(reviewCount+1)/log(500) × 0.5) × 100
//
// Deploy to: mobile_app/app/api/google/competitor-analysis/route.ts

import axios from "axios";
import { google } from "googleapis";

/* ── helpers ──────────────────────────────────────────────────────── */
async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${data.error}`);
  return data.access_token as string;
}

async function safeFetch(url: string, token: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { console.warn(`[competitor] ${res.status} ${url}`); return null; }
    return res.json();
  } catch (e: any) {
    console.warn(`[competitor] fetch error: ${e.message}`);
    return null;
  }
}

function compositeScore(rating: number, reviewCount: number): number {
  const ratingScore  = (rating / 5) * 50;
  const volumeScore  = (Math.log(reviewCount + 1) / Math.log(500)) * 50;
  return Math.min(100, ratingScore + volumeScore);
}

/* ── types ──────────────────────────────────────────────────────────── */
export interface Competitor {
  placeId:        string;
  name:           string;
  address:        string;
  rating:         number;
  reviewCount:    number;
  isOpen:         boolean | null;
  photoRef:       string | null;
  distance:       number;          // metres
  compositeScore: number;          // 0–100
  rank:           number;          // 1 = best in area
  isOwn:          boolean;
  lat:            number;
  lng:            number;
  primaryType:    string;
  priceLevel:     number | null;   // 0–4
  website:        string | null;
  phone:          string | null;
}

export interface CompetitorAnalysisResponse {
  success:     boolean;
  error?:      string;
  own:         Competitor;
  competitors: Competitor[];       // sorted by rank (best first), own excluded
  all:         Competitor[];       // sorted by rank, own included
  meta: {
    searchRadius:  number;         // metres used
    totalFound:    number;
    ownRank:       number;
    topRank:       number;
    ratingGap:     number;         // own.rating - rank#1.rating (negative = behind)
    reviewGap:     number;         // own.reviewCount - rank#1.reviewCount
    locationName:  string;
    category:      string;
    searchedAt:    string;
  };
}

/* ── main handler ────────────────────────────────────────────────────── */
export async function GET(req: Request): Promise<Response> {
  console.log("===== COMPETITOR ANALYSIS =====");
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const radiusParam = parseInt(searchParams.get("radius") ?? "1500");
    const radius = Math.min(Math.max(radiusParam, 500), 5000);

    if (!locationId)
      return Response.json({ success: false, error: "locationId required" }, { status: 400 });

    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });

    /* ── 1. User profile + refresh token ── */
    const profile = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/profile/view`,
      { headers: { Authorization: authHeader } },
    );
    const user = profile.data.user;
    if (!user.googleRefreshToken)
      return Response.json({ success: false, error: "Google not connected" }, { status: 401 });

    let accessToken: string;
    try {
      accessToken = await refreshGoogleToken(user.googleRefreshToken);
    } catch {
      return Response.json({ success: false, error: "Google token expired. Re-connect Google." }, { status: 401 });
    }

    /* ── 2. Fetch user's own GBP location ── */
    const locationData = await safeFetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/locations/${locationId}` +
      `?readMask=title,categories,latlng,regularHours,metadata,websiteUri,phoneNumbers,storefrontAddress`,
      accessToken,
    );

    if (!locationData?.latlng)
      return Response.json({ success: false, error: "Could not fetch your business location coordinates." }, { status: 422 });

    const { latitude, longitude } = locationData.latlng;
    const ownName     = locationData.title ?? "My Business";
    const ownCategory = locationData.categories?.primaryCategory?.displayName ?? "";
    const googleType  = locationData.categories?.primaryCategory?.name ?? "";   // e.g. gcid:music_school
    const ownAddress  = locationData.storefrontAddress
      ? [locationData.storefrontAddress.addressLines?.[0], locationData.storefrontAddress.locality].filter(Boolean).join(", ")
      : "";
    const ownWebsite  = locationData.websiteUri ?? null;
    const ownPhone    = locationData.phoneNumbers?.primaryPhone ?? null;
    const ownIsOpen   = locationData.metadata?.mapsUri ? null : null;  // determined via Places below

    console.log(`Own business: ${ownName} @ ${latitude},${longitude} — category: ${ownCategory}`);

    /* ── 3. Fetch own reviews (rating + count) ── */
    const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    oauth2.setCredentials({ access_token: accessToken, refresh_token: user.googleRefreshToken });
    const acctSvc = google.mybusinessaccountmanagement({ version: "v1", auth: oauth2 });
    const acctRes = await acctSvc.accounts.list();
    const accountName = acctRes.data.accounts?.[0]?.name ?? "";

    const ratingMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
    let ownRating      = 0;
    let ownReviewCount = 0;

    if (accountName) {
      const rRes = await safeFetch(
        `https://mybusiness.googleapis.com/v4/${accountName}/locations/${locationId}/reviews?pageSize=1`,
        accessToken,
      );
      if (rRes) {
        ownReviewCount = rRes.totalReviewCount ?? 0;
        ownRating      = rRes.averageRating
          ? parseFloat(parseFloat(rRes.averageRating).toFixed(1))
          : 0;
      }
    }
    console.log(`Own reviews: ${ownReviewCount}, rating: ${ownRating}`);

    /* ── 4. Google Places Nearby Search ── */
    //  Derive a Places API type from GBP category.
    //  GBP categories (gcid:*) don't map 1:1 to Places types, so we do a
    //  text-search fallback if type is not useful.
    const PLACES_KEY = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

    if (!PLACES_KEY) {
      console.warn("[competitor] No Google Maps API key found — using fallback data");
    }

    // Map common GBP gcid → Places type (best effort)
    const GBP_TO_PLACES: Record<string, string> = {
      "gcid:music_school":         "school",
      "gcid:dance_school":         "school",
      "gcid:gym":                  "gym",
      "gcid:yoga_studio":          "gym",
      "gcid:restaurant":           "restaurant",
      "gcid:cafe":                 "cafe",
      "gcid:bakery":               "bakery",
      "gcid:bar":                  "bar",
      "gcid:beauty_salon":         "beauty_salon",
      "gcid:hair_salon":           "hair_care",
      "gcid:spa":                  "spa",
      "gcid:doctor":               "doctor",
      "gcid:dentist":              "dentist",
      "gcid:pharmacy":             "pharmacy",
      "gcid:lawyer":               "lawyer",
      "gcid:accountant":           "accounting",
      "gcid:real_estate_agency":   "real_estate_agency",
      "gcid:clothing_store":       "clothing_store",
      "gcid:electronics_store":    "electronics_store",
      "gcid:jewelry_store":        "jewelry_store",
      "gcid:supermarket":          "supermarket",
      "gcid:hotel":                "lodging",
      "gcid:school":               "school",
      "gcid:tutoring_service":     "school",
    };

    const placesType = GBP_TO_PLACES[googleType] ?? "establishment";
    let nearbyPlaces: any[] = [];

    if (PLACES_KEY) {
      // Use Places API v2 (New) — Nearby Search
      // Falls back to legacy v1 if v2 not available
      const nearbyUrl =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${latitude},${longitude}` +
        `&radius=${radius}` +
        `&type=${placesType}` +
        `&key=${PLACES_KEY}`;

      try {
        const nr = await fetch(nearbyUrl);
        const nd = await nr.json();
        if (nd.status === "OK" || nd.status === "ZERO_RESULTS") {
          nearbyPlaces = nd.results ?? [];
          console.log(`[competitor] Nearby places found: ${nearbyPlaces.length}`);
        } else {
          console.warn(`[competitor] Places API status: ${nd.status} — ${nd.error_message ?? ""}`);
          // If type is too restrictive, retry with keyword
          if (nd.status === "ZERO_RESULTS" && ownName) {
            const retryUrl =
              `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
              `?location=${latitude},${longitude}` +
              `&radius=${radius}` +
              `&keyword=${encodeURIComponent(ownCategory)}` +
              `&key=${PLACES_KEY}`;
            const rr = await fetch(retryUrl);
            const rd = await rr.json();
            nearbyPlaces = rd.results ?? [];
            console.log(`[competitor] Retry by keyword: ${nearbyPlaces.length}`);
          }
        }
      } catch (e: any) {
        console.warn(`[competitor] Places API fetch failed: ${e.message}`);
      }
    }

    /* ── 5. Fetch Place Details for top competitors ── */
    // Limit to 9 competitors to avoid rate limits + latency
    const topNearby = nearbyPlaces.slice(0, 9);

    async function fetchPlaceDetails(placeId: string): Promise<any | null> {
      if (!PLACES_KEY) return null;
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${placeId}` +
        `&fields=place_id,name,formatted_address,geometry,rating,user_ratings_total,opening_hours,photos,website,formatted_phone_number,types,price_level` +
        `&key=${PLACES_KEY}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        return data.status === "OK" ? data.result : null;
      } catch { return null; }
    }

    const detailResults = await Promise.all(topNearby.map(p => fetchPlaceDetails(p.place_id)));

    /* ── 6. Distance calculation (Haversine) ── */
    function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371000;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    /* ── 7. Build competitor objects ── */
    const competitors: Competitor[] = detailResults
      .filter((d): d is any => d !== null)
      .map((d, i) => {
        const nearby = topNearby[i];
        const lat2   = d.geometry?.location?.lat ?? nearby?.geometry?.location?.lat ?? latitude;
        const lng2   = d.geometry?.location?.lng ?? nearby?.geometry?.location?.lng ?? longitude;
        const rating = d.rating ?? nearby?.rating ?? 0;
        const count  = d.user_ratings_total ?? nearby?.user_ratings_total ?? 0;
        return {
          placeId:        d.place_id,
          name:           d.name ?? nearby?.name ?? "Unknown",
          address:        d.formatted_address ?? nearby?.vicinity ?? "",
          rating,
          reviewCount:    count,
          isOpen:         d.opening_hours?.open_now ?? nearby?.opening_hours?.open_now ?? null,
          photoRef:       d.photos?.[0]?.photo_reference ?? nearby?.photos?.[0]?.photo_reference ?? null,
          distance:       haversine(latitude, longitude, lat2, lng2),
          compositeScore: compositeScore(rating, count),
          rank:           0,          // assigned below
          isOwn:          false,
          lat:            lat2,
          lng:            lng2,
          primaryType:    (d.types ?? nearby?.types ?? [])[0] ?? "",
          priceLevel:     d.price_level ?? nearby?.price_level ?? null,
          website:        d.website ?? null,
          phone:          d.formatted_phone_number ?? null,
        } satisfies Competitor;
      });

    /* ── 8. Build "own" as a Competitor object ── */
    const ownCompetitor: Competitor = {
      placeId:        locationId,
      name:           ownName,
      address:        ownAddress,
      rating:         ownRating,
      reviewCount:    ownReviewCount,
      isOpen:         null,
      photoRef:       null,
      distance:       0,
      compositeScore: compositeScore(ownRating, ownReviewCount),
      rank:           0,
      isOwn:          true,
      lat:            latitude,
      lng:            longitude,
      primaryType:    placesType,
      priceLevel:     null,
      website:        ownWebsite,
      phone:          ownPhone,
    };

    /* ── 9. Rank all (own + competitors) by compositeScore desc ── */
    const all = [...competitors, ownCompetitor].sort((a, b) => b.compositeScore - a.compositeScore);
    all.forEach((c, i) => { c.rank = i + 1; });

    const ownInAll   = all.find(c => c.isOwn)!;
    const top        = all[0];
    const ratingGap  = parseFloat((ownInAll.rating - top.rating).toFixed(1));
    const reviewGap  = ownInAll.reviewCount - top.reviewCount;

    const sortedCompetitors = all.filter(c => !c.isOwn);

    console.log(`Own rank: #${ownInAll.rank} of ${all.length} | Gap to #1: ${ratingGap}★ / ${reviewGap} reviews`);

    return Response.json({
      success:     true,
      own:         ownInAll,
      competitors: sortedCompetitors,
      all,
      meta: {
        searchRadius:  radius,
        totalFound:    all.length,
        ownRank:       ownInAll.rank,
        topRank:       1,
        ratingGap,
        reviewGap,
        locationName:  ownName,
        category:      ownCategory,
        searchedAt:    new Date().toISOString(),
      },
    } satisfies CompetitorAnalysisResponse);

  } catch (err: any) {
    console.error("COMPETITOR ANALYSIS ERROR:", err);
    return Response.json({ success: false, error: err.message ?? "Competitor analysis failed" }, { status: 500 });
  }
}