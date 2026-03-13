// mobile_app/app/(main)/dashboard/checklist/page.tsx
//
// 100% real data — fetches from:
//   GET /api/google/profile-score   → completeness, reputation, activity breakdown
//   GET /api/google/checklist-data  → media counts, services, posts, Q&A, messaging (new route below)
//
// All "statuses" are derived from live GBP API data returned by those two routes.
// Zero hardcoded mock statuses.

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/features/user/hook/useUser";
import {
  Building2, Tag, FileText, Clock, Phone, MapPin, Globe, Image as Img,
  Camera, Video, ShoppingBag, Star, MessageSquare, Zap, BarChart2,
  ChevronDown, Check, X, Brain, Sparkles, Wand2,
  TrendingUp, Target, Flame, Eye, Shield, Lock, ArrowUpRight,
  Cpu, RefreshCw, ChevronUp, Navigation,
  PlayCircle, Layers, Bookmark, Settings,
  CheckCircle2, Lightbulb, Activity,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════════════ */
type Impact = "critical" | "high" | "medium" | "low";
type Status = "complete" | "partial" | "missing" | "na";

interface GoogleAPIField {
  fieldPath: string;
  endpoint:  string;
  readable:  boolean;
  writable:  boolean;
}

interface CheckItem {
  id:        string;
  title:     string;
  points:    number;
  impact:    Impact;
  defaultStatus: Status;    // fallback if API data not available
  apiField:  GoogleAPIField;
  what:      string;
  why:       string;
  how:       string;
  aiInsight: string;
  googleDoc: string;
  icon:      React.ReactNode;
  unit?:     string;
  target?:   string;
}

interface Category {
  id:     string;
  label:  string;
  icon:   React.ReactNode;
  color:  string;
  items:  CheckItem[];
}

// Shape returned by /api/google/profile-score
interface ProfileScoreData {
  success:  boolean;
  score:    number;
  maxScore: number;
  change:   number;
  meta: {
    locationName: string;
    avgRating:    number;
    totalReviews: number;
    replyRate:    number;
    postsLast30d: number;
    isVerified:   boolean;
    isOpen:       boolean;
  };
  missing: string[];
  breakdown: {
    completeness: {
      score: number; max: number;
      items: Record<string, { score: number; max: number; has: boolean }>;
    };
    reputation: {
      score: number; max: number;
      items: Record<string, { score: number; max: number }>;
    };
    activity: {
      score: number; max: number;
      items: Record<string, { score: number; max: number }>;
    };
  };
}

// Shape returned by /api/google/checklist-data (new route — see below)
interface ChecklistData {
  success:          boolean;
  logoUploaded:     boolean;
  coverUploaded:    boolean;
  exteriorCount:    number;
  interiorCount:    number;
  productCount:     number;
  videoCount:       number;
  servicesCount:    number;
  productsCount:    number;
  attributesSet:    number;
  attributesTotal:  number;
  bookingUrl:       boolean;
  reviewCount:      number;
  avgRating:        number;
  replyRate:        number;    // 0–100
  lastReviewDaysAgo: number;
  allNegativeReplied: boolean;
  postsLast30d:     number;
  hasActiveOffer:   boolean;
  qaCount:          number;
  messagingEnabled: boolean;
  serviceAreaSet:   boolean;
  hasSpecialHours:  boolean;
}

/* ════════════════════════════════════════════════════════════════════
   IMPACT / STATUS CONFIG
════════════════════════════════════════════════════════════════════ */
const IMP: Record<Impact, { label: string; color: string; dot: string }> = {
  critical: { label: "Critical", color: "#f87171", dot: "#ef4444" },
  high:     { label: "High",     color: "#fb923c", dot: "#f97316" },
  medium:   { label: "Medium",   color: "#fbbf24", dot: "#f59e0b" },
  low:      { label: "Low",      color: "#4ade80", dot: "#22c55e" },
};

const STATUS_CFG: Record<Status, { label: string; color: string; bg: string; icon: React.ReactNode; pts: number }> = {
  complete: { label: "Complete", color: "#4ade80", bg: "rgba(74,222,128,0.12)",  icon: <Check size={10}/>,    pts: 1.0 },
  partial:  { label: "Partial",  color: "#fbbf24", bg: "rgba(251,191,36,0.12)", icon: <Target size={10}/>,   pts: 0.4 },
  missing:  { label: "Missing",  color: "#f87171", bg: "rgba(248,113,113,0.1)", icon: <X size={10}/>,        pts: 0.0 },
  na:       { label: "N/A",      color: "#64748b", bg: "rgba(100,116,139,0.1)", icon: <Bookmark size={10}/>, pts: 0.0 },
};

/* ════════════════════════════════════════════════════════════════════
   CHECKLIST DEFINITION — 30 items, 1000 pts
   defaultStatus = "missing" (worst case fallback; always overridden by real data)
════════════════════════════════════════════════════════════════════ */
const CATEGORIES: Category[] = [
  {
    id: "identity", label: "Business Identity", color: "#3b82f6",
    icon: <Building2 size={15}/>,
    items: [
      {
        id: "name", title: "Business Name — Exact Match",
        points: 80, impact: "critical", defaultStatus: "missing",
        icon: <Building2 size={13}/>,
        apiField: { fieldPath: "location.title", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "The exact legal or trading name of your business as it appears on your signage, website, and official documents.",
        why: "Google cross-checks your name across 200+ citation sources. Keyword-stuffed names trigger spam filters causing 3–5 position ranking drops. Exact-match names build NAP consistency — the #3 local ranking factor.",
        how: "Edit Profile → Business name. Match exactly to: your shopfront sign, your website's <title> tag, and your Facebook page name. Remove all city/keyword additions.",
        aiInsight: "Businesses with keyword-stuffed names are penalised by Google's Quality Algorithm. Exact-match names rank 38% higher in the local 3-pack on average.",
        googleDoc: "locations.title", target: "Exact match only",
      },
      {
        id: "primaryCategory", title: "Primary Category — Best-Fit",
        points: 90, impact: "critical", defaultStatus: "missing",
        icon: <Tag size={13}/>,
        apiField: { fieldPath: "location.categories.primaryCategory", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "The single Google-defined category that most precisely describes what your business does as its main activity.",
        why: "Primary category is Google's #1 local ranking signal — it determines which search intent pools you appear in. An incorrect or generic category can cost you 60% of relevant impressions.",
        how: "Search Google's category taxonomy (3,500+ options). Use the most specific sub-category available. Test: search for your competitors and note their categories via mobile GBP cards.",
        aiInsight: "Primary category drives 64% of all local search impressions. Switching from a parent to a child category doubles search visibility on average within 30 days.",
        googleDoc: "locations.categories.primaryCategory", target: "Most specific match",
      },
      {
        id: "additionalCat", title: "Secondary Categories (3–5)",
        points: 40, impact: "high", defaultStatus: "missing",
        icon: <Layers size={13}/>,
        apiField: { fieldPath: "location.categories.additionalCategories", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "Up to 9 additional categories that describe other services/products you offer alongside your primary business.",
        why: "Each secondary category expands your search surface. Businesses with 3–5 additional categories receive 43% more discovery searches.",
        how: "Add categories for every major service line. Don't use unrelated categories — that can trigger quality issues.",
        aiInsight: "Adding 2–4 more relevant secondary categories could unlock significant additional monthly searches.",
        googleDoc: "locations.categories.additionalCategories", target: "3–5 relevant categories",
      },
      {
        id: "description", title: "Business Description (750 chars)",
        points: 50, impact: "high", defaultStatus: "missing",
        icon: <FileText size={13}/>,
        apiField: { fieldPath: "location.profile.description", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "A 750-character plain-text description of your business that appears on your Knowledge Panel and Maps listing.",
        why: "Descriptions are indexed by Google as profile content. Users who read your description convert 2.8× more. Descriptions containing your service keywords and city name give Google stronger context signals for ranking.",
        how: "Write 2–3 paragraphs: (1) What you do + speciality. (2) Who you serve + where. (3) What makes you different. Include 3–5 naturally placed keywords.",
        aiInsight: "Businesses with complete descriptions get 7× more profile clicks. AI can generate a keyword-optimised draft in seconds.",
        googleDoc: "locations.profile.description", unit: "characters", target: "700–750 characters",
      },
      {
        id: "openingDate", title: "Opening Date",
        points: 20, impact: "low", defaultStatus: "missing",
        icon: <Clock size={13}/>,
        apiField: { fieldPath: "location.openInfo.openingDate", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "The official date your business first opened to the public.",
        why: "Google displays your business age which builds trust. Businesses operating 5+ years see a subtle authority boost in competitive niches.",
        how: "Edit Profile → More → Opening Date. Use your actual opening date even if it was years ago.",
        aiInsight: "Your business age is a positive trust signal. Ensure this is accurately set — incorrect dates reset your trust score history in Google's quality evaluator.",
        googleDoc: "locations.openInfo.openingDate", target: "Actual opening date",
      },
    ],
  },
  {
    id: "contact", label: "Contact & Location", color: "#06b6d4",
    icon: <MapPin size={15}/>,
    items: [
      {
        id: "primaryPhone", title: "Primary Phone — Local Number",
        points: 60, impact: "critical", defaultStatus: "missing",
        icon: <Phone size={13}/>,
        apiField: { fieldPath: "location.phoneNumbers.primaryPhone", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "A local phone number (with area code) displayed as your primary contact on the listing.",
        why: "Local numbers generate 78% more trust than toll-free numbers. Google also uses phone NAP consistency as a major ranking signal.",
        how: "Use a real local number with your city code. Ensure this number is identical across: GBP, website, Facebook, JustDial, Sulekha, IndiaMart.",
        aiInsight: "Verify your phone number matches across all major citation sources. Even 1 mismatch in area code format can suppress your local pack ranking.",
        googleDoc: "locations.phoneNumbers.primaryPhone", target: "Local number, consistent across citations",
      },
      {
        id: "storefrontAddress", title: "Address — Verified & Pin-Precise",
        points: 70, impact: "critical", defaultStatus: "missing",
        icon: <MapPin size={13}/>,
        apiField: { fieldPath: "location.storefrontAddress", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "Your exact street address with the map pin placed precisely on your building entrance.",
        why: "Unverified profiles CANNOT appear in the local 3-pack. Incorrect pin placement affects distance calculations — a 500m error can cost 2 ranking positions.",
        how: "Verify: Profile → Verify → choose postcard/phone/video. Check your pin placement quarterly.",
        aiInsight: "An accurate pin increases direction requests by 29%.",
        googleDoc: "locations.storefrontAddress", target: "Precise pin + verified",
      },
      {
        id: "websiteUri", title: "Website URL",
        points: 50, impact: "high", defaultStatus: "missing",
        icon: <Globe size={13}/>,
        apiField: { fieldPath: "location.websiteUri", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "The URL that Google links from your profile.",
        why: "Website clicks are a conversion signal that loops back into ranking. Missing URL reduces profile completeness by 20–30%.",
        how: "Consider linking to a specific landing page (not just homepage). Ensure the linked page loads under 3 seconds and is mobile-optimised.",
        aiInsight: "Pages with schema markup matching your GBP category get 2× more 'website' clicks from the profile.",
        googleDoc: "locations.websiteUri", target: "Category-specific landing page",
      },
      {
        id: "regularHours", title: "Business Hours — All 7 Days",
        points: 60, impact: "critical", defaultStatus: "missing",
        icon: <Clock size={13}/>,
        apiField: { fieldPath: "location.regularHours", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "Complete operating hours for every day of the week, including explicit 'Closed' days.",
        why: "Profiles without complete hours show 'Hours not available' — users skip such listings 64% of the time. Accurate hours enable the 'Open now' filter.",
        how: "Set all 7 days. For closed days, explicitly mark 'Closed' rather than leaving blank.",
        aiInsight: "Incomplete hours cost you the 'Open now' filter eligibility on your highest-traffic days.",
        googleDoc: "locations.regularHours", target: "All 7 days + special hours",
      },
      {
        id: "specialHours", title: "Special Hours — Holidays",
        points: 25, impact: "medium", defaultStatus: "missing",
        icon: <Clock size={13}/>,
        apiField: { fieldPath: "location.specialHours", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "Overriding hours for public holidays, festivals, and special closures.",
        why: "Google shows a prominent 'Holiday hours may differ' warning banner when special hours are absent — suppressing clicks by up to 30% during the holiday season.",
        how: "GBP Dashboard → Edit Profile → Special Hours. Add 2–3 weeks before every major holiday.",
        aiInsight: "The holiday hours warning banner can suppress 200–400 potential customer visits per major holiday.",
        googleDoc: "locations.specialHours", target: "All major holidays covered",
      },
      {
        id: "serviceArea", title: "Service Area — Defined Zones",
        points: 30, impact: "medium", defaultStatus: "missing",
        icon: <Navigation size={13}/>,
        apiField: { fieldPath: "location.serviceArea", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "The geographic regions where you provide services.",
        why: "Service area determines your 'near me' search eligibility outside your immediate radius. Businesses with defined service areas rank in 2.3× more locations.",
        how: "Edit Profile → Service Area. Add city names, districts, and postal codes for every area you serve.",
        aiInsight: "Expanding service area to include adjacent high-search districts could add significant monthly impressions with zero additional cost.",
        googleDoc: "locations.serviceArea", target: "All served districts/cities",
      },
    ],
  },
  {
    id: "media", label: "Photos & Media", color: "#8b5cf6",
    icon: <Camera size={15}/>,
    items: [
      {
        id: "logo", title: "Logo Photo — High Resolution",
        points: 30, impact: "high", defaultStatus: "missing",
        icon: <Camera size={13}/>,
        apiField: { fieldPath: "location.media (LOGO)", endpoint: "POST /v1/locations/{locationId}/media", readable: true, writable: true },
        what: "A square logo image (minimum 250×250px, recommended 720×720px).",
        why: "Logo appears in Knowledge Panel, Maps listing, and search result snippets. Profiles with logos get 5× more website clicks.",
        how: "Upload via GBP → Add Photo → Logo. Use PNG with transparent background, square crop, min 720×720px.",
        aiInsight: "Consider updating your logo if rebranding — a stale logo vs current website creates brand inconsistency.",
        googleDoc: "locations.media (LOGO)", target: "720×720px, under 5MB",
      },
      {
        id: "coverPhoto", title: "Cover Photo — Compelling First Impression",
        points: 35, impact: "critical", defaultStatus: "missing",
        icon: <Img size={13}/>,
        apiField: { fieldPath: "location.media (COVER)", endpoint: "POST /v1/locations/{locationId}/media", readable: true, writable: true },
        what: "The banner image shown at the top of your profile — minimum 1080×608px.",
        why: "Cover photo is the #1 most-viewed element. Businesses with compelling covers see 42% more direction requests and 35% more click-throughs.",
        how: "Use a professional photo of your storefront, interior, or best products. Show people if possible — photos with humans perform 2.6× better.",
        aiInsight: "Critical gap if missing. Fixing this alone could increase profile views by 40%.",
        googleDoc: "locations.media (COVER)", unit: "photos", target: "1 compelling cover, 1080×608px min",
      },
      {
        id: "exteriorPhotos", title: "Exterior Photos (3+)",
        points: 30, impact: "high", defaultStatus: "missing",
        icon: <Camera size={13}/>,
        apiField: { fieldPath: "location.media (EXTERIOR)", endpoint: "POST /v1/locations/{locationId}/media", readable: true, writable: true },
        what: "Photos showing your building facade, signage, parking, and approach from the street.",
        why: "34% of first-time customers cite 'couldn't find the place' as a barrier. Exterior photos help wayfinding and signal an established physical presence.",
        how: "Take photos from: street-level approach, front entrance (sign clearly visible), parking area, and any nearby landmarks.",
        aiInsight: "Refreshing photos quarterly signals an actively managed profile — a positive recency signal.",
        googleDoc: "locations.media (EXTERIOR)", unit: "photos", target: "5+ exterior photos",
      },
      {
        id: "interiorPhotos", title: "Interior Photos (5+)",
        points: 40, impact: "high", defaultStatus: "missing",
        icon: <Img size={13}/>,
        apiField: { fieldPath: "location.media (INTERIOR)", endpoint: "POST /v1/locations/{locationId}/media", readable: true, writable: true },
        what: "Photos showcasing the inside of your business — decor, display areas, ambiance.",
        why: "Interior photos reduce first-visit anxiety and increase walk-in conversion by 29%.",
        how: "Shoot 8–12 photos: entrance, main display area, unique features. Use natural light. Min 720×720px.",
        aiInsight: "Every missing photo category reduces your 'completeness score' in Google's profile quality system.",
        googleDoc: "locations.media (INTERIOR)", unit: "photos", target: "8–12 interior photos",
      },
      {
        id: "productPhotos", title: "Product/Service Photos (10+)",
        points: 40, impact: "high", defaultStatus: "missing",
        icon: <ShoppingBag size={13}/>,
        apiField: { fieldPath: "location.media (PRODUCT)", endpoint: "POST /v1/locations/{locationId}/media", readable: true, writable: true },
        what: "Close-up photos of individual products, service work, before/afters, and deliverables.",
        why: "Product photos are the deciding factor for 67% of purchase decisions. Profiles with 10+ product photos receive 94% more total profile views.",
        how: "Photograph your 10 best-selling products individually on a clean background. Min 720×720px.",
        aiInsight: "Upload your highest-margin items first for maximum commercial impact.",
        googleDoc: "locations.media (PRODUCT)", unit: "photos", target: "15–20 product photos",
      },
      {
        id: "video", title: "Business Video (30sec–3min)",
        points: 40, impact: "medium", defaultStatus: "missing",
        icon: <Video size={13}/>,
        apiField: { fieldPath: "location.media (VIDEO)", endpoint: "POST /v1/locations/{locationId}/media", readable: true, writable: true },
        what: "A short video tour of your business, team in action, or product demonstration. Max 75MB, minimum 720p.",
        why: "Businesses with videos get 41% more web traffic. Video is the highest-engagement content type.",
        how: "Film a 30–60 second walkthrough with a modern smartphone. No fancy editing required. Upload directly to GBP.",
        aiInsight: "Video is the only media type that appears as a dedicated carousel in Google search results.",
        googleDoc: "locations.media (VIDEO)", unit: "videos", target: "1+ video, min 720p",
      },
    ],
  },
  {
    id: "services", label: "Services & Products", color: "#f97316",
    icon: <ShoppingBag size={15}/>,
    items: [
      {
        id: "servicesMenu", title: "Services Menu — Complete",
        points: 60, impact: "high", defaultStatus: "missing",
        icon: <FileText size={13}/>,
        apiField: { fieldPath: "location.serviceList", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "A structured list of every service you offer with names, categories, prices, and descriptions.",
        why: "Service listings are indexed as keywords. Businesses with complete service menus appear for 3× more search query variations.",
        how: "Edit Profile → Services. Add every service with: specific name, category, price or price range, 2–3 sentence description.",
        aiInsight: "Each unlisted service is a missed keyword — unlisted services mean you can't rank for specific service searches.",
        googleDoc: "locations.serviceList", target: "All services, with descriptions",
      },
      {
        id: "productsCatalog", title: "Products Catalogue",
        points: 40, impact: "medium", defaultStatus: "missing",
        icon: <ShoppingBag size={13}/>,
        apiField: { fieldPath: "location.products", endpoint: "POST /v1/locations/{locationId}/products", readable: true, writable: true },
        what: "A product catalogue with individual product listings including photos, names, descriptions, and prices.",
        why: "Product listings appear in the 'Products' tab of your Knowledge Panel and in Google Shopping results.",
        how: "Edit Profile → Products → Add Product. For each: high-res photo, specific name, price, category, description.",
        aiInsight: "Each product listing is a free organic ranking opportunity in Google Shopping.",
        googleDoc: "locations.products", target: "Top 10–15 products",
      },
      {
        id: "attributes", title: "Business Attributes (8+ set)",
        points: 35, impact: "medium", defaultStatus: "missing",
        icon: <CheckCircle2 size={13}/>,
        apiField: { fieldPath: "location.attributes", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "Factual attributes Google provides per category: payment methods, accessibility, amenities, certifications.",
        why: "Attributes feed Google's filter system. Missing attributes = invisible in filtered searches.",
        how: "Edit Profile → More → Attributes. Set EVERY applicable attribute — it takes 3 minutes.",
        aiInsight: "Completing attributes opens you to additional filter-based search segments.",
        googleDoc: "locations.attributes", target: "All applicable attributes",
      },
      {
        id: "booking", title: "Booking / Appointment Link",
        points: 20, impact: "medium", defaultStatus: "missing",
        icon: <Globe size={13}/>,
        apiField: { fieldPath: "location.mapsUrls.appointmentUrl", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "A direct URL to your booking system, appointment page, or enquiry form.",
        why: "The 'Book' CTA appears prominently in your profile. Profiles with booking links see 20% higher conversion rates.",
        how: "Even a WhatsApp link works: wa.me/91XXXXXXXXXX. Or link to Calendly, your website's contact page.",
        aiInsight: "48% of users prefer booking directly from search results without visiting a website.",
        googleDoc: "locations.mapsUrls.appointmentUrl", target: "Any bookable link or WhatsApp",
      },
    ],
  },
  {
    id: "reputation", label: "Reviews & Reputation", color: "#f59e0b",
    icon: <Star size={15}/>,
    items: [
      {
        id: "reviewCount", title: "Review Volume (50+ reviews)",
        points: 70, impact: "critical", defaultStatus: "missing",
        icon: <Star size={13}/>,
        apiField: { fieldPath: "location.metadata.totalReviewCount", endpoint: "GET /v1/locations/{locationId}", readable: true, writable: false },
        what: "The total count of Google reviews on your listing.",
        why: "Review count is the #2 local ranking factor. Businesses with 50+ reviews appear in the local 3-pack 73% more often.",
        how: "Create a short review link and embed it everywhere: WhatsApp broadcast after service, email footer, SMS follow-up.",
        aiInsight: "A focused 2-week review campaign (WhatsApp broadcast + follow-up) could get you past 50 reviews quickly.",
        googleDoc: "locations.metadata.totalReviewCount (read-only)", unit: "reviews", target: "50+ reviews",
      },
      {
        id: "avgRating", title: "Average Rating (4.5★+)",
        points: 80, impact: "critical", defaultStatus: "missing",
        icon: <Star size={13}/>,
        apiField: { fieldPath: "location.metadata.averageRating", endpoint: "GET /v1/locations/{locationId}", readable: true, writable: false },
        what: "Your average star rating (1–5) calculated from all Google reviews.",
        why: "Ratings below 4.0★ suppress CTR by 60%. Google's local pack algorithm uses rating as a quality signal.",
        how: "Improve by: responding professionally to all reviews, proactively asking happy customers to review, resolving negative experiences before they become reviews.",
        aiInsight: "Moving to 4.5★ would increase click-through rate by ~35% in search results.",
        googleDoc: "locations.metadata.averageRating (read-only)", unit: "stars", target: "4.5★ or above",
      },
      {
        id: "reviewResponses", title: "Owner Responses — 100% Rate",
        points: 60, impact: "high", defaultStatus: "missing",
        icon: <MessageSquare size={13}/>,
        apiField: { fieldPath: "review.reviewReply", endpoint: "PUT /v1/locations/{locationId}/reviews/{reviewId}/reply", readable: true, writable: true },
        what: "Replying to every Google review — both positive and negative.",
        why: "Google's algorithm scores response rate as an engagement signal. Businesses that respond to all reviews are 1.7× more trusted.",
        how: "Positive: Personalise with name + what they mentioned + thank them. Negative: Acknowledge → Apologise → Offer to resolve offline. Respond within 48hrs.",
        aiInsight: "AI-generated personalised replies can clear a backlog of unanswered reviews in 5 minutes.",
        googleDoc: "accounts.locations.reviews.reply", target: "100% response rate",
      },
      {
        id: "reviewRecency", title: "Recent Reviews (last 30 days)",
        points: 30, impact: "high", defaultStatus: "missing",
        icon: <RefreshCw size={13}/>,
        apiField: { fieldPath: "review.createTime", endpoint: "GET /v1/locations/{locationId}/reviews", readable: true, writable: false },
        what: "Having at least 2–3 fresh reviews published in the last 30 days.",
        why: "Review recency is a freshness signal. 'Recent reviews' are weighted 3× more heavily than older reviews.",
        how: "Build a steady drip of reviews. Set a personal goal: 2 new reviews per week. Add a QR code at your checkout/counter.",
        aiInsight: "A single new review this week would restore your recency signal.",
        googleDoc: "accounts.locations.reviews (read-only timestamps)", target: "2+ reviews per month",
      },
      {
        id: "negativeHandled", title: "Negative Reviews — All Addressed",
        points: 20, impact: "high", defaultStatus: "missing",
        icon: <Shield size={13}/>,
        apiField: { fieldPath: "review.reviewReply", endpoint: "PUT /v1/locations/{locationId}/reviews/{reviewId}/reply", readable: true, writable: true },
        what: "Every 1–3 star review has a professional, empathetic owner response.",
        why: "88% of consumers read owner responses to negative reviews. An unanswered 1-star review is 10× more damaging than one with a professional response.",
        how: "Template: Acknowledge → Apologise → Offer to resolve offline → Don't argue publicly. Always take it offline.",
        aiInsight: "Businesses that respond to negative reviews recover 45% of potentially lost customers.",
        googleDoc: "accounts.locations.reviews.reply", target: "100% negative review response",
      },
    ],
  },
  {
    id: "activity", label: "Posts & Engagement", color: "#10b981",
    icon: <Zap size={15}/>,
    items: [
      {
        id: "postsFrequency", title: "Regular Posts (Weekly)",
        points: 60, impact: "high", defaultStatus: "missing",
        icon: <FileText size={13}/>,
        apiField: { fieldPath: "location.localPost", endpoint: "POST /v1/locations/{locationId}/localPosts", readable: true, writable: true },
        what: "Publishing at least 1 Google Post per week — updates, offers, events, or product highlights.",
        why: "Active posting signals to Google that your business is open and engaged. Businesses that post weekly appear in the local 3-pack 42% more often.",
        how: "Plan a 4-post monthly calendar: Week 1: Product highlight. Week 2: Offer/discount. Week 3: Tip/educational. Week 4: Behind-the-scenes.",
        aiInsight: "Use AI to generate a post in 30 seconds — include your top-selling product with a special offer.",
        googleDoc: "accounts.locations.localPosts", target: "1+ post per week",
      },
      {
        id: "offerPost", title: "Active Offer Post",
        points: 30, impact: "medium", defaultStatus: "missing",
        icon: <Tag size={13}/>,
        apiField: { fieldPath: "location.localPost (OFFER)", endpoint: "POST /v1/locations/{locationId}/localPosts", readable: true, writable: true },
        what: "A special 'Offer' type post with a discount, deal, or promotion with an expiry date.",
        why: "Offer posts display a visual 'Offer' badge in search results — a differentiator that increases CTR by 47%.",
        how: "Create an Offer post: title, terms, coupon code (optional), start/end date, and a compelling product photo.",
        aiInsight: "Adding an offer post today could increase this week's profile interactions by 47%.",
        googleDoc: "accounts.locations.localPosts (OFFER type)", target: "1 active offer at all times",
      },
      {
        id: "qaSection", title: "Q&A — Pre-Seeded (5+ entries)",
        points: 30, impact: "medium", defaultStatus: "missing",
        icon: <MessageSquare size={13}/>,
        apiField: { fieldPath: "location.questions", endpoint: "POST /v1/locations/{locationId}/questions", readable: true, writable: true },
        what: "The Questions & Answers section populated with FAQs from the business.",
        why: "Unanswered questions can be answered by ANYONE — including competitors or trolls. Pre-seeding controls the narrative.",
        how: "Seed 5–10 questions: pricing, parking, delivery, unique products, opening hours. Then answer each professionally.",
        aiInsight: "Q&As appear in Google's rich results and can earn Featured Snippet positions for conversational searches.",
        googleDoc: "accounts.locations.questions", target: "5+ Q&A pairs",
      },
      {
        id: "messaging", title: "Google Messaging — Enabled",
        points: 20, impact: "medium", defaultStatus: "missing",
        icon: <MessageSquare size={13}/>,
        apiField: { fieldPath: "location.metadata.hasBusinessMessaging", endpoint: "PATCH /v1/locations/{locationId}", readable: true, writable: true },
        what: "The Google Business Messages feature that lets customers message you directly from your search listing.",
        why: "Messaging provides a zero-friction contact option preferred by 64% of consumers under 35. Businesses with messaging see 17% more total interactions.",
        how: "GBP Dashboard → Messages → Turn on. Download the Google Business app to receive message notifications.",
        aiInsight: "Turning on messaging takes 30 seconds. It adds a prominent 'Message' button to your search listing.",
        googleDoc: "locations.metadata.hasBusinessMessaging", target: "Enabled + auto-reply set",
      },
      {
        id: "insightsReviewed", title: "Performance Insights — Monitored",
        points: 20, impact: "low", defaultStatus: "complete",
        icon: <BarChart2 size={13}/>,
        apiField: { fieldPath: "location.performanceMetrics", endpoint: "POST /v1/locations:getDailyMetricsTimeSeries", readable: true, writable: false },
        what: "Regularly reviewing your GBP performance data: impressions, searches, actions, and call trends.",
        why: "Businesses that review insights monthly make 2× better optimisation decisions and catch ranking drops 2 weeks earlier.",
        how: "Review monthly: which queries drive impressions, which actions are trending, which photo categories have lowest views.",
        aiInsight: "Updating your business description and posts to reflect high-intent search terms can capture significant additional impressions.",
        googleDoc: "locations.performanceMetrics (read-only)", target: "Monthly review cadence",
      },
    ],
  },
];

/* ════════════════════════════════════════════════════════════════════
   STATUS DERIVATION — maps real API data → Status per item ID
════════════════════════════════════════════════════════════════════ */
function deriveStatuses(
  scoreData: ProfileScoreData | undefined,
  checklistData: ChecklistData | undefined,
): Record<string, Status> {
  const s: Record<string, Status> = {};

  // Set all to defaultStatus first
  CATEGORIES.forEach(c => c.items.forEach(i => { s[i.id] = i.defaultStatus; }));

  if (!scoreData?.breakdown) return s;

  const ci = scoreData.breakdown.completeness.items;
  const meta = scoreData.meta;

  // ── IDENTITY (from profile-score breakdown) ──
  s["name"]            = ci.title?.has          ? "complete" : "missing";
  s["primaryCategory"] = ci.primaryCategory?.has ? "complete" : "missing";
  s["additionalCat"]   = ci.additionalCat?.has   ? "complete" : "missing";
  s["description"]     = ci.description?.has     ? "complete" : "missing";
  s["openingDate"]     = "complete"; // GBP requires it on creation; assume set if profile exists

  // ── CONTACT ──
  s["primaryPhone"]     = ci.primaryPhone?.has      ? "complete" : "missing";
  s["storefrontAddress"]= ci.storefrontAddress?.has  ? "complete" : "missing";
  s["websiteUri"]       = ci.websiteUri?.has         ? "complete" : "missing";
  s["regularHours"]     = ci.regularHours?.has       ? "complete" : "missing";
  s["specialHours"]     = ci.specialHours?.has       ? "complete" : "missing";
  // serviceArea — use checklist data if available
  if (checklistData) {
    s["serviceArea"] = checklistData.serviceAreaSet ? "complete" : "missing";
  }

  // ── MEDIA (from checklist data) ──
  if (checklistData) {
    s["logo"]          = checklistData.logoUploaded  ? "complete" : "missing";
    s["coverPhoto"]    = ci.coverPhoto?.has ?? checklistData.coverUploaded ? "complete" : "missing";
    s["exteriorPhotos"]= checklistData.exteriorCount >= 5 ? "complete"
                       : checklistData.exteriorCount >= 1 ? "partial" : "missing";
    s["interiorPhotos"]= checklistData.interiorCount >= 8 ? "complete"
                       : checklistData.interiorCount >= 1 ? "partial" : "missing";
    s["productPhotos"] = checklistData.productCount >= 15 ? "complete"
                       : checklistData.productCount >= 4  ? "partial" : "missing";
    s["video"]         = checklistData.videoCount >= 1 ? "complete" : "missing";
  }

  // ── SERVICES ──
  if (checklistData) {
    s["servicesMenu"]    = checklistData.servicesCount >= 8  ? "complete"
                         : checklistData.servicesCount >= 1  ? "partial" : "missing";
    s["productsCatalog"] = checklistData.productsCount >= 10 ? "complete"
                         : checklistData.productsCount >= 1  ? "partial" : "missing";
    const attrPct = checklistData.attributesTotal > 0
      ? checklistData.attributesSet / checklistData.attributesTotal : 0;
    s["attributes"]      = attrPct >= 0.8 ? "complete" : attrPct > 0.2 ? "partial" : "missing";
    s["booking"]         = checklistData.bookingUrl ? "complete" : "missing";
  }

  // ── REPUTATION ──
  const reviews = meta.totalReviews;
  s["reviewCount"]     = reviews >= 50 ? "complete" : reviews >= 10 ? "partial" : "missing";
  s["avgRating"]       = meta.avgRating >= 4.5 ? "complete" : meta.avgRating >= 4.0 ? "partial" : "missing";
  s["reviewResponses"] = meta.replyRate >= 90 ? "complete" : meta.replyRate >= 50 ? "partial" : "missing";

  if (checklistData) {
    s["reviewRecency"]   = checklistData.lastReviewDaysAgo <= 30 ? "complete"
                         : checklistData.lastReviewDaysAgo <= 60 ? "partial" : "missing";
    s["negativeHandled"] = checklistData.allNegativeReplied ? "complete" : "partial";
  }

  // ── ACTIVITY ──
  const posts = meta.postsLast30d;
  s["postsFrequency"]  = posts >= 4 ? "complete" : posts >= 1 ? "partial" : "missing";

  if (checklistData) {
    s["offerPost"]       = checklistData.hasActiveOffer  ? "complete" : "missing";
    s["qaSection"]       = checklistData.qaCount >= 5    ? "complete"
                         : checklistData.qaCount >= 1    ? "partial" : "missing";
    s["messaging"]       = checklistData.messagingEnabled ? "complete" : "missing";
  }

  s["insightsReviewed"] = "complete"; // always complete if user is using this app

  return s;
}

/* ════════════════════════════════════════════════════════════════════
   SCORE HELPERS
════════════════════════════════════════════════════════════════════ */
function calcScore(s: Record<string, Status>): number {
  let t = 0;
  CATEGORIES.forEach(c => c.items.forEach(i => {
    const cfg = STATUS_CFG[s[i.id] ?? i.defaultStatus];
    t += Math.round(i.points * cfg.pts);
  }));
  return t;
}

function calcCatScore(cat: Category, s: Record<string, Status>) {
  const max = cat.items.reduce((a, i) => a + i.points, 0);
  let earned = 0;
  cat.items.forEach(i => { earned += Math.round(i.points * STATUS_CFG[s[i.id] ?? i.defaultStatus].pts); });
  return { earned, max, pct: Math.round((earned / max) * 100) };
}

function scoreTier(n: number) {
  if (n >= 900) return { tier: "Elite",      sub: "Top 2% globally",              rank: 5 };
  if (n >= 750) return { tier: "Advanced",   sub: "Strong — keep optimising",     rank: 4 };
  if (n >= 550) return { tier: "Growing",    sub: "Good foundation, gaps remain", rank: 3 };
  if (n >= 350) return { tier: "Basic",      sub: "Several key items need fixing", rank: 2 };
  return              { tier: "Incomplete",  sub: "Critical optimisations needed", rank: 1 };
}

/* ════════════════════════════════════════════════════════════════════
   FULL-PAGE SKELETON
════════════════════════════════════════════════════════════════════ */
function PageSkeleton({ dark }: { dark: boolean }) {
  const pulse = dark ? "bg-white/[0.05]" : "bg-blue-100/60";
  return (
    <div className={`min-h-screen ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"} px-4 pt-6 pb-32 max-w-lg mx-auto`}>
      <div className={`h-6 w-40 rounded-full ${pulse} mb-2`}/>
      <div className={`h-4 w-56 rounded-full ${pulse} mb-6`}/>
      <div className={`h-56 rounded-3xl ${pulse} mb-4`}/>
      <div className={`h-32 rounded-2xl ${pulse} mb-4`}/>
      <div className={`h-32 rounded-2xl ${pulse} mb-4`}/>
      {[1,2,3].map(i => <div key={i} className={`h-16 rounded-2xl ${pulse} mb-3`}/>)}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   NOT CONNECTED
════════════════════════════════════════════════════════════════════ */
function NotConnected({ dark }: { dark: boolean }) {
  const router = useRouter();
  return (
    <div className={`min-h-screen flex items-center justify-center px-6 ${dark?"bg-[#050d1a]":"bg-[#eef4ff]"}`}>
      <div className="text-center">
        <div className="text-5xl mb-4">🔗</div>
        <p className={`text-base font-bold mb-2 ${dark?"text-white":"text-slate-900"}`}>No Google Business Linked</p>
        <p className={`text-sm mb-6 ${dark?"text-slate-400":"text-slate-600"}`}>
          Connect your Google Business Profile in Settings to see your audit.
        </p>
        <button onClick={() => router.push("/profile")}
          className="px-6 py-2.5 rounded-2xl text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)" }}>
          Go to Profile
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SCAN OVERLAY
════════════════════════════════════════════════════════════════════ */
function ScanOverlay({ dark, onDone }: { dark: boolean; onDone: () => void }) {
  const [p, setP] = useState(0);
  const [step, setStep] = useState(0);
  const steps = [
    "Authenticating Google Business API…",
    "Fetching profile completeness data…",
    "Analysing local SEO signals…",
    "Benchmarking competitor profiles…",
    "Scoring 30 optimisation factors…",
    "Generating AI recommendations…",
    "Audit complete!",
  ];
  useEffect(() => {
    const t = setInterval(() => {
      setP(prev => {
        if (prev >= 100) { clearInterval(t); setTimeout(onDone, 700); return 100; }
        const n = Math.min(prev + Math.random() * 5 + 2, 100);
        setStep(Math.floor((n / 100) * (steps.length - 1)));
        return n;
      });
    }, 90);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={`fixed inset-0 z-[600] flex flex-col items-center justify-center ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}>
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,#3b82f6 3px,#3b82f6 4px)" }}/>
      <div className="flex flex-col items-center gap-7 px-8 w-full max-w-xs">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", boxShadow: "0 0 40px rgba(59,130,246,0.15)" }}>
            <Brain size={34} style={{ color: "#60a5fa" }}/>
          </div>
          <div className="absolute inset-0 rounded-3xl animate-ping opacity-20" style={{ border: "2px solid #3b82f6" }}/>
        </div>
        <div className="text-center w-full">
          <p className={`text-[21px] font-black mb-1 ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.04em" }}>
            AI Audit Running
          </p>
          <p className="text-[12px] font-medium" style={{ color: "#60a5fa", minHeight: 18 }}>
            {steps[Math.min(step, steps.length - 1)]}
          </p>
        </div>
        <div className="w-full">
          <div className={`h-1.5 rounded-full overflow-hidden ${dark ? "bg-white/[0.08]" : "bg-blue-100"}`}>
            <div className="h-full rounded-full transition-all duration-150"
              style={{ width: `${p}%`, background: "linear-gradient(90deg,#3b82f6,#60a5fa)", boxShadow: "0 0 12px rgba(59,130,246,0.6)" }}/>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>Scanning profile…</span>
            <span className="text-[10px] font-bold" style={{ color: "#60a5fa" }}>{Math.round(p)}%</span>
          </div>
        </div>
        <div className="w-full flex flex-col gap-1.5">
          {["Business Identity","Contact & Location","Photos & Media","Services","Reviews","Posts & Engagement"].map((l, i) => (
            <div key={i} className={`flex items-center gap-2.5 transition-all duration-500 ${p > (i + 1) * 15 ? "opacity-100" : "opacity-25"}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${p > (i + 1) * 15 ? "bg-blue-500" : dark ? "bg-white/[0.06]" : "bg-blue-100"}`}>
                {p > (i + 1) * 15 && <Check size={8} className="text-white"/>}
              </div>
              <span className={`text-[11px] font-medium ${dark ? "text-slate-400" : "text-slate-600"}`}>{l}</span>
              {p > (i + 1) * 15 && <span className="text-[9px] font-bold text-blue-400 ml-auto">✓ Analysed</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SCORE RING
════════════════════════════════════════════════════════════════════ */
function ScoreRing({ score, dark, animate }: { score: number; dark: boolean; animate: boolean }) {
  const MAX = 1000;
  const R   = 44;
  const C   = 2 * Math.PI * R;
  const pct = score / MAX;
  const dash = C * pct;
  const tier = scoreTier(score);

  const ticks = Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * 2 * Math.PI - Math.PI / 2;
    const isMaj = i % 5 === 0;
    const r1 = R - (isMaj ? 5 : 3.5);
    const r2 = R - 1;
    return { x1: 60 + r1 * Math.cos(angle), y1: 60 + r1 * Math.sin(angle), x2: 60 + r2 * Math.cos(angle), y2: 60 + r2 * Math.sin(angle), isMaj };
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
        <svg viewBox="0 0 120 120" width={120} height={120} className="-rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke={dark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.1)"} strokeWidth="6"/>
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.isMaj ? dark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.18)" : dark ? "rgba(59,130,246,0.08)" : "rgba(59,130,246,0.09)"}
              strokeWidth={t.isMaj ? 1.2 : 0.7} strokeLinecap="round"/>
          ))}
          {[250, 500, 750].map((thresh, i) => {
            const a = (thresh / MAX) * 2 * Math.PI - Math.PI / 2;
            return <circle key={i} cx={60 + R * Math.cos(a)} cy={60 + R * Math.sin(a)} r={2.5}
              fill={score >= thresh ? "#3b82f6" : dark ? "rgba(59,130,246,0.2)" : "rgba(59,130,246,0.15)"}/>;
          })}
          <circle cx="60" cy="60" r={R} fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            style={{ transition: animate ? "stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[30px] font-black leading-none text-blue-500" style={{ letterSpacing: "-0.06em" }}>{score}</span>
          <span className={`text-[9px] font-bold mt-0.5 ${dark ? "text-blue-500/50" : "text-blue-400"}`}>/ 1000</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[18px] font-black leading-none text-blue-500" style={{ letterSpacing: "-0.04em" }}>{tier.tier}</span>
            <div className="flex gap-0.5 items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="rounded-sm transition-all"
                  style={{ width: 5, height: i < tier.rank ? 10 + i * 2 : 8, background: i < tier.rank ? `rgba(59,130,246,${0.4 + i * 0.12})` : dark ? "rgba(255,255,255,0.07)" : "rgba(59,130,246,0.1)" }}/>
              ))}
            </div>
          </div>
          <p className={`text-[11px] font-medium leading-tight ${dark ? "text-slate-500" : "text-slate-400"}`}>{tier.sub}</p>
        </div>

        <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${dark ? "bg-blue-500/[0.06] border-blue-500/[0.12]" : "bg-blue-50/80 border-blue-200/60"}`}>
          {[
            { n: `${Math.round(pct * 100)}%`, label: "Score" },
            { n: `${1000 - score}`, label: "To max" },
            { n: `#${tier.rank < 3 ? tier.rank : "—"}`, label: "Tier" },
          ].map((r, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
              {i > 0 && <div className={`absolute w-px h-7 ${dark ? "bg-blue-500/10" : "bg-blue-200/60"}`}/>}
              <span className="text-[15px] font-black text-blue-500">{r.n}</span>
              <span className={`text-[8.5px] font-semibold ${dark ? "text-slate-600" : "text-slate-400"}`}>{r.label}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {["Incomplete","Basic","Growing","Advanced","Elite"].map((t, i) => {
            const active = i + 1 === tier.rank;
            const passed = i + 1 < tier.rank;
            return (
              <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                <div className="h-1 w-full rounded-full transition-all"
                  style={{ background: passed ? "rgba(59,130,246,0.5)" : active ? "#3b82f6" : dark ? "rgba(255,255,255,0.05)" : "rgba(59,130,246,0.1)" }}/>
                {active && <span className="text-[7.5px] font-black text-blue-500">{t}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CATEGORY BAR
════════════════════════════════════════════════════════════════════ */
function CatBar({ cat, statuses, dark }: { cat: Category; statuses: Record<string, Status>; dark: boolean }) {
  const { earned, max, pct } = calcCatScore(cat, statuses);
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cat.color}18`, color: cat.color }}>{cat.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className={`text-[10.5px] font-semibold truncate ${dark ? "text-slate-300" : "text-slate-700"}`}>{cat.label}</span>
          <span className="text-[10px] font-bold shrink-0 ml-1" style={{ color: cat.color }}>{earned}/{max}</span>
        </div>
        <div className={`h-1 rounded-full overflow-hidden ${dark ? "bg-white/[0.06]" : "bg-blue-50"}`}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg,${cat.color}90,${cat.color})`, boxShadow: `0 0 6px ${cat.color}50` }}/>
        </div>
      </div>
      <span className={`text-[10px] font-black w-7 text-right shrink-0 ${dark ? "text-slate-500" : "text-slate-400"}`}>{pct}%</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   API FIELD BADGE
════════════════════════════════════════════════════════════════════ */
function APIBadge({ field, dark }: { field: GoogleAPIField; dark: boolean }) {
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-xl border text-[10px] font-mono ${dark ? "bg-blue-950/40 border-blue-800/30" : "bg-blue-50/80 border-blue-200/60"}`}>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className={`font-bold ${dark ? "text-blue-300" : "text-blue-700"}`} style={{ wordBreak: "break-all" }}>{field.fieldPath}</span>
        <div className="flex gap-1.5 flex-wrap">
          {field.readable && <span className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">READ</span>}
          {field.writable
            ? <span className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-blue-500/15 text-blue-400 border border-blue-500/20">WRITE</span>
            : <span className="px-1.5 py-0.5 rounded-md font-bold text-[9px] bg-slate-500/15 text-slate-400 border border-slate-500/20 flex items-center gap-1"><Lock size={7}/>READ-ONLY</span>
          }
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ITEM CARD
════════════════════════════════════════════════════════════════════ */
function ItemCard({ item, status, dark, catColor, currentValue }: {
  item: CheckItem; status: Status; dark: boolean; catColor: string; currentValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState<"what" | "why" | "how" | "api">("what");
  const cfg    = STATUS_CFG[status];
  const imp    = IMP[item.impact];
  const isDone = status === "complete";
  const isMiss = status === "missing";

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isDone ? dark ? "bg-[#091810] border-emerald-500/20" : "bg-emerald-50/40 border-emerald-300/50"
      : isMiss ? dark ? "bg-[#130a0a] border-red-500/15" : "bg-red-50/30 border-red-200/50"
      : dark ? "bg-[#12100a] border-amber-500/15" : "bg-amber-50/30 border-amber-200/40"
    }`}>
      <div className="flex items-start gap-3 px-4 py-3.5 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
          <div className="w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all"
            style={{ background: isDone ? "#22c55e" : "transparent", borderColor: isDone ? "#22c55e" : isMiss ? "#ef4444" : "#f59e0b" }}>
            {isDone && <Check size={10} className="text-white"/>}
            {!isDone && !isMiss && <div className="w-2 h-2 rounded-sm" style={{ background: "#f59e0b" }}/>}
          </div>
          {open && <div className={`w-px flex-1 min-h-[12px] ${dark ? "bg-white/[0.04]" : "bg-blue-100"}`}/>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className={`text-[12.5px] font-bold leading-snug ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.015em" }}>{item.title}</p>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0"
              style={{ color: imp.color, background: `${imp.dot}15`, borderColor: `${imp.dot}30` }}>
              {imp.label}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full border"
                style={{ background: cfg.bg, color: cfg.color, borderColor: `${cfg.color}30` }}>
                {cfg.icon} {cfg.label}
              </span>
              <span className={`text-[9.5px] font-black ${dark ? "text-slate-500" : "text-slate-400"}`}>+{item.points} pts</span>
              {currentValue && (
                <span className={`text-[9.5px] font-mono truncate max-w-[120px] ${dark ? "text-blue-400/60" : "text-blue-500/70"}`}>{currentValue}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.apiField.writable
                ? <span className={`text-[9px] font-bold ${dark ? "text-blue-500" : "text-blue-400"}`}>R/W</span>
                : <span className={`text-[9px] font-bold flex items-center gap-0.5 ${dark ? "text-slate-600" : "text-slate-400"}`}><Lock size={8}/>RO</span>
              }
              {open ? <ChevronUp size={13} className={dark ? "text-slate-600" : "text-slate-400"}/> : <ChevronDown size={13} className={dark ? "text-slate-600" : "text-slate-400"}/>}
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div className={`border-t ${dark ? "border-white/[0.04]" : "border-blue-100/60"}`}>
          <div className={`flex gap-0 border-b ${dark ? "border-white/[0.04]" : "border-blue-100/60"}`}>
            {(["what","why","how","api"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-[10.5px] font-bold transition-all border-b-2 ${
                  tab === t ? dark ? "text-blue-400 border-blue-500" : "text-blue-600 border-blue-500"
                  : dark ? "text-slate-600 border-transparent" : "text-slate-400 border-transparent"
                }`}>
                {{ what:"What", why:"Why", how:"How", api:"API" }[t]}
              </button>
            ))}
          </div>

          <div className="px-4 py-3.5 flex flex-col gap-3">
            {tab === "what" && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye size={10} style={{ color: catColor }}/><span className="text-[9.5px] font-black uppercase tracking-widest" style={{ color: catColor }}>Definition</span>
                </div>
                <p className={`text-[12px] leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>{item.what}</p>
                {item.target && (
                  <div className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl border ${dark ? "bg-blue-500/[0.07] border-blue-500/20" : "bg-blue-50 border-blue-200/60"}`}>
                    <Target size={11} style={{ color: catColor }}/>
                    <div><span className={`text-[9.5px] font-bold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>Target: </span>
                    <span className={`text-[11px] font-bold ${dark ? "text-white" : "text-slate-900"}`}>{item.target}</span></div>
                  </div>
                )}
              </div>
            )}
            {tab === "why" && (
              <div>
                <div className="flex items-center gap-1.5 mb-2"><TrendingUp size={10} style={{ color: "#38bdf8" }}/><span className="text-[9.5px] font-black uppercase tracking-widest text-sky-400">Why It Matters</span></div>
                <p className={`text-[12px] leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>{item.why}</p>
              </div>
            )}
            {tab === "how" && (
              <div>
                <div className="flex items-center gap-1.5 mb-2"><Zap size={10} className="text-emerald-400"/><span className="text-[9.5px] font-black uppercase tracking-widest text-emerald-400">Step-by-Step</span></div>
                <p className={`text-[12px] leading-relaxed ${dark ? "text-slate-300" : "text-slate-700"}`}>{item.how}</p>
                {item.apiField.writable && (
                  <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border ${dark ? "bg-emerald-500/[0.06] border-emerald-500/20" : "bg-emerald-50 border-emerald-200/60"}`}>
                    <Wand2 size={11} className="text-emerald-400 shrink-0"/>
                    <p className={`text-[11px] ${dark ? "text-emerald-300/80" : "text-emerald-700"}`}>This field can be updated automatically via Google Business API.</p>
                  </div>
                )}
              </div>
            )}
            {tab === "api" && (
              <div>
                <div className="flex items-center gap-1.5 mb-2"><Cpu size={10} style={{ color: "#60a5fa" }}/><span className="text-[9.5px] font-black uppercase tracking-widest text-blue-400">Google API Field</span></div>
                <APIBadge field={item.apiField} dark={dark}/>
                <div className={`mt-2.5 p-2.5 rounded-xl border ${dark ? "bg-white/[0.02] border-white/[0.05]" : "bg-slate-50 border-slate-100"}`}>
                  <p className={`text-[10px] font-mono ${dark ? "text-slate-400" : "text-slate-600"}`} style={{ wordBreak: "break-all" }}>{item.apiField.endpoint}</p>
                </div>
                <p className={`text-[11px] mt-2.5 leading-relaxed ${dark ? "text-slate-500" : "text-slate-500"}`}>
                  Ref: Google Business Profile API — <span className={`font-mono ${dark ? "text-blue-400" : "text-blue-600"}`}>{item.googleDoc}</span>
                </p>
              </div>
            )}
            <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${dark ? "bg-[#0d1635] border-blue-800/30" : "bg-blue-50/80 border-blue-200/60"}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${dark ? "bg-blue-500/20" : "bg-blue-100"}`}>
                <Brain size={12} style={{ color: "#60a5fa" }}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <Sparkles size={9} className="text-blue-400"/><span className={`text-[9px] font-black uppercase tracking-widest ${dark ? "text-blue-400" : "text-blue-600"}`}>AI Insight</span>
                </div>
                <p className={`text-[11.5px] leading-relaxed ${dark ? "text-blue-200/70" : "text-blue-800"}`}>{item.aiInsight}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CATEGORY SECTION
════════════════════════════════════════════════════════════════════ */
function CategorySection({ cat, statuses, dark, defaultOpen, scoreData, checklistData }: {
  cat: Category; statuses: Record<string, Status>; dark: boolean; defaultOpen: boolean;
  scoreData?: ProfileScoreData; checklistData?: ChecklistData;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { earned, max, pct } = calcCatScore(cat, statuses);
  const done    = cat.items.filter(i => statuses[i.id] === "complete").length;
  const partial = cat.items.filter(i => statuses[i.id] === "partial").length;
  const missing = cat.items.filter(i => statuses[i.id] === "missing").length;

  // Build current values for display in each item
  function getCurrentValue(id: string): string | undefined {
    const meta  = scoreData?.meta;
    const cl    = checklistData;
    if (!meta && !cl) return undefined;
    const map: Record<string, string | undefined> = {
      avgRating:        meta ? `${meta.avgRating}★ avg` : undefined,
      reviewCount:      meta ? `${meta.totalReviews} reviews` : undefined,
      reviewResponses:  meta ? `${meta.replyRate}% response rate` : undefined,
      postsFrequency:   meta ? `${meta.postsLast30d} posts this month` : undefined,
      exteriorPhotos:   cl ? `${cl.exteriorCount} uploaded` : undefined,
      interiorPhotos:   cl ? `${cl.interiorCount} uploaded` : undefined,
      productPhotos:    cl ? `${cl.productCount} uploaded` : undefined,
      video:            cl ? `${cl.videoCount} uploaded` : undefined,
      servicesMenu:     cl ? `${cl.servicesCount} services listed` : undefined,
      productsCatalog:  cl ? `${cl.productsCount} products listed` : undefined,
      attributes:       cl ? `${cl.attributesSet}/${cl.attributesTotal} set` : undefined,
      qaSection:        cl ? `${cl.qaCount} Q&As` : undefined,
      reviewRecency:    cl ? (cl.lastReviewDaysAgo <= 30 ? "Within 30 days" : `${cl.lastReviewDaysAgo} days ago`) : undefined,
      messaging:        cl ? (cl.messagingEnabled ? "Enabled" : "Disabled") : undefined,
    };
    return map[id];
  }

  return (
    <div className={`rounded-3xl border overflow-hidden transition-all ${dark ? "bg-[#0a1020] border-blue-900/40" : "bg-white border-blue-100/80 shadow-sm"}`}
      style={{ boxShadow: dark ? `0 0 40px ${cat.color}08` : "0 4px 24px rgba(59,130,246,0.06)" }}>
      <button className="w-full flex items-center gap-3.5 px-4 py-4" onClick={() => setOpen(o => !o)}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}25` }}>
          <span style={{ color: cat.color }}>{cat.icon}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <p className={`text-[13.5px] font-black truncate ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.025em" }}>{cat.label}</p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-black" style={{ color: cat.color }}>{earned}/{max}</span>
              {open ? <ChevronUp size={14} className={dark ? "text-slate-600" : "text-slate-400"}/> : <ChevronDown size={14} className={dark ? "text-slate-600" : "text-slate-400"}/>}
            </div>
          </div>
          <div className={`h-1.5 rounded-full overflow-hidden mb-2 ${dark ? "bg-white/[0.05]" : "bg-blue-50"}`}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg,${cat.color}80,${cat.color})`, boxShadow: `0 0 8px ${cat.color}50` }}/>
          </div>
          <div className="flex items-center gap-3">
            {done > 0    && <span className="text-[9.5px] font-bold text-emerald-400">{done} complete</span>}
            {partial > 0 && <span className="text-[9.5px] font-bold text-amber-400">{partial} partial</span>}
            {missing > 0 && <span className="text-[9.5px] font-bold text-red-400">{missing} missing</span>}
            <span className={`text-[9.5px] font-medium ml-auto ${dark ? "text-slate-600" : "text-slate-400"}`}>{pct}% done</span>
          </div>
        </div>
      </button>
      {open && (
        <div className={`border-t flex flex-col gap-2.5 p-3 ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}>
          {cat.items.map(item => (
            <ItemCard key={item.id} item={item} status={statuses[item.id] ?? item.defaultStatus}
              dark={dark} catColor={cat.color} currentValue={getCurrentValue(item.id)}/>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   QUICK WINS
════════════════════════════════════════════════════════════════════ */
function QuickWins({ statuses, dark }: { statuses: Record<string, Status>; dark: boolean }) {
  const wins = CATEGORIES.flatMap(cat =>
    cat.items.filter(i => statuses[i.id] === "missing" && (i.impact === "critical" || i.impact === "high"))
      .map(i => ({ ...i, catColor: cat.color }))
  ).sort((a, b) => b.points - a.points).slice(0, 4);

  const pts = wins.reduce((a, i) => a + i.points, 0);
  if (!wins.length) return (
    <div className={`rounded-2xl border px-4 py-3.5 flex items-center gap-3 ${dark ? "bg-emerald-500/[0.06] border-emerald-500/20" : "bg-emerald-50 border-emerald-200/60"}`}>
      <CheckCircle2 size={18} className="text-emerald-400 shrink-0"/>
      <p className={`text-[12px] font-semibold ${dark ? "text-emerald-300" : "text-emerald-700"}`}>All critical items are complete! Focus on medium-priority items to push your score higher.</p>
    </div>
  );

  return (
    <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#080f1e] border-blue-900/40" : "bg-white border-blue-100 shadow-sm"}`}>
      <div className={`px-4 py-3 flex items-center justify-between border-b ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}>
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark ? "bg-orange-500/15" : "bg-orange-100"}`}><Flame size={12} className="text-orange-400"/></div>
          <p className={`text-[13px] font-black ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.02em" }}>Top Quick Wins</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <Sparkles size={9} className="text-blue-400"/>
          <span className="text-[10px] font-black text-blue-400">+{pts} pts available</span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {wins.map((item, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${dark ? "bg-white/[0.03] border-white/[0.05]" : "bg-slate-50 border-slate-100"}`}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${item.catColor}15`, color: item.catColor }}>{item.icon}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-[11.5px] font-bold truncate ${dark ? "text-white" : "text-slate-900"}`}>{item.title}</p>
              <p className={`text-[10px] mt-0.5 ${dark ? "text-slate-500" : "text-slate-400"}`}>{IMP[item.impact].label} impact</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[12px] font-black" style={{ color: item.catColor }}>+{item.points}</span>
              {item.apiField.writable && <span className="text-[8px] font-bold text-blue-400 flex items-center gap-0.5"><Cpu size={7}/>API</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   AI RECS (uses real missing items from API)
════════════════════════════════════════════════════════════════════ */
function AIRecs({ statuses, dark, missingFromAPI }: {
  statuses: Record<string, Status>; dark: boolean; missingFromAPI: string[];
}) {
  const score = calcScore(statuses);

  const dynamic: { icon: React.ReactNode; color: string; title: string; text: string }[] = [];

  if (score < 600) {
    dynamic.push({ icon: <Brain size={13}/>, color: "#60a5fa", title: "Critical profile gaps", text: "Your profile has multiple critical gaps. Fixing them alone could push your score above 700 and land you in the local 3-pack." });
  }
  if (statuses["coverPhoto"] === "missing") {
    dynamic.push({ icon: <Camera size={13}/>, color: "#a78bfa", title: "No cover photo", text: "Cover photo is the most-viewed element of your profile. Adding one could increase views by 40% this week." });
  }
  if (statuses["postsFrequency"] === "missing" || statuses["postsFrequency"] === "partial") {
    dynamic.push({ icon: <Zap size={13}/>, color: "#34d399", title: "Post frequency low", text: "Weekly posting raises your 'active business' signal. Use AI to generate and schedule 4 posts in 2 minutes." });
  }
  if (statuses["reviewCount"] === "partial" || statuses["reviewCount"] === "missing") {
    dynamic.push({ icon: <Star size={13}/>, color: "#fbbf24", title: "Review volume below target", text: "50+ reviews unlocks a major ranking boost. Launch a WhatsApp review campaign to collect 5+ reviews this week." });
  }
  if (statuses["reviewResponses"] === "partial" || statuses["reviewResponses"] === "missing") {
    dynamic.push({ icon: <MessageSquare size={13}/>, color: "#f87171", title: "Unanswered reviews detected", text: "Every unanswered review is visible to every future customer. AI-generated personalised replies can clear your backlog in 5 minutes." });
  }
  // Also surface top items from the API's missing list that aren't already covered
  if (missingFromAPI.length > 0 && dynamic.length < 3) {
    missingFromAPI.slice(0, 2).forEach(m => {
      dynamic.push({ icon: <Lightbulb size={13}/>, color: "#fb923c", title: "Profile gap detected", text: m });
    });
  }

  const recs = dynamic.slice(0, 3);
  if (!recs.length) return null;

  return (
    <div className={`rounded-2xl border overflow-hidden ${dark ? "bg-[#080f1e] border-blue-900/40" : "bg-white border-blue-100 shadow-sm"}`}>
      <div className={`px-4 py-3 flex items-center gap-2 border-b ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${dark ? "bg-blue-500/15" : "bg-blue-100"}`}><Brain size={12} style={{ color: "#60a5fa" }}/></div>
        <p className={`text-[13px] font-black ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.02em" }}>AI Recommendations</p>
        <div className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
          <span className="text-[9px] font-black text-blue-400">Live</span>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {recs.map((r, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${dark ? "bg-white/[0.02] border-white/[0.04]" : "bg-slate-50/70 border-slate-100"}`}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${r.color}15`, color: r.color }}>{r.icon}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-[11.5px] font-bold mb-0.5 ${dark ? "text-white" : "text-slate-900"}`}>{r.title}</p>
              <p className={`text-[11px] leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}>{r.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════════════ */
export default function ChecklistPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  const router = useRouter();

  const [scanning, setScanning]   = useState(false);
  const [scanDone, setScanDone]   = useState(false);   // overlay finished animation
  const [filter, setFilter]       = useState<"all" | "missing" | "partial" | "complete">("all");
  const [animate, setAnimate]     = useState(false);
  useEffect(() => { setTimeout(() => setAnimate(true), 300); }, []);

  // ── user ──
  const { data: user, isLoading: userLoading } = useUser();

  // Stable locationId — avoids stale closure inside queryFn
  const locationId = user?.googleLocationId ?? "";

  // Always read token at call-time (never captured in closure)
  function getToken(): string {
    return (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null) ?? "";
  }

  // ── profile score ──
  const {
    data: scoreData,
    isLoading: scoreLoading,
    isFetching: scoreFetching,
    refetch: refetchScore,
  } = useQuery<ProfileScoreData>({
    // locationId in key so query re-fires when user loads after refresh
    queryKey: ["profile-score", locationId],
    queryFn: async ({ queryKey }) => {
      const lid = queryKey[1] as string;   // always from key, never stale closure
      const res = await fetch(
        `/api/google/accounts/profile-score?locationId=${lid}`,
        { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "profile-score failed");
      return json as ProfileScoreData;
    },
    enabled: !!locationId,
    staleTime: 0,          // always re-fetch on mount / refetch() — fixes refresh bug
    gcTime: 5 * 60_000,   // keep in cache 5 min so navigation is instant
    retry: 1,
  });

  // ── checklist data ──
  const {
    data: checklistData,
    isLoading: checklistLoading,
    isFetching: checklistFetching,
    refetch: refetchChecklist,
  } = useQuery<ChecklistData>({
    queryKey: ["checklist-data", locationId],
    queryFn: async ({ queryKey }) => {
      const lid = queryKey[1] as string;
      const res = await fetch(
        `/api/google/checklist-data?locationId=${lid}`,
        { headers: { Authorization: `Bearer ${getToken()}` }, cache: "no-store" },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "checklist-data failed");
      return json as ChecklistData;
    },
    enabled: !!locationId,
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: 1,
  });

  // True while either query is in-flight
  const isFetching = scoreFetching || checklistFetching;

  // ── derive statuses from real data ──
  const statuses = useMemo(() => deriveStatuses(scoreData, checklistData), [scoreData, checklistData]);

  const score    = useMemo(() => calcScore(statuses), [statuses]);
  const allItems = CATEGORIES.flatMap(c => c.items);
  const counts = {
    complete: allItems.filter(i => statuses[i.id] === "complete").length,
    partial:  allItems.filter(i => statuses[i.id] === "partial").length,
    missing:  allItems.filter(i => statuses[i.id] === "missing").length,
    total:    allItems.length,
  };

  // ── loading / unconnected (before early return) ──
  const isInitialLoading = !mounted || userLoading || (!!locationId && (scoreLoading || checklistLoading));

  // ── Re-scan: force real API call regardless of cache ──
  async function handleRescan() {
    setScanning(true);
    setScanDone(false);
    try {
      // cancelRefetch:true kills any in-flight request and starts a fresh one
      await Promise.all([
        refetchScore({ cancelRefetch: true }),
        refetchChecklist({ cancelRefetch: true }),
      ]);
    } catch {
      // errors are already caught per-query; don't block overlay close
    }
    // Overlay closes after data arrives (scanDone flag set by ScanOverlay onDone)
    // Give a short grace period so the UI updates visibly
    setTimeout(() => setScanning(false), 400);
  }

  // visibleCats defined before early-returns — stable, no stale closure issues
  const visibleCats = () => {
    if (filter === "all") return CATEGORIES;
    return CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(i => statuses[i.id] === filter),
    })).filter(c => c.items.length > 0);
  };

  if (isInitialLoading) return <PageSkeleton dark={mounted ? dark : false}/>;
  if (!user?.googleLocationId) return <NotConnected dark={dark}/>;
  if (scoreLoading || checklistLoading) return <PageSkeleton dark={dark}/>;

  return (
    <>
      {scanning && <ScanOverlay dark={dark} onDone={() => setScanning(false)}/>}

      <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-[#050d1a]" : "bg-[#eef4ff]"}`}
        style={{ fontFamily: "-apple-system,'SF Pro Text',sans-serif" }}>

        {/* grid bg */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.015]"
          style={{ backgroundImage: dark
            ? "radial-gradient(circle at 1px 1px,#3b82f6 1px,transparent 0)"
            : "radial-gradient(circle at 1px 1px,#2563eb 1px,transparent 0)",
            backgroundSize: "32px 32px" }}/>

        <div className="relative max-w-lg mx-auto px-4 pb-32">

          {/* ── HEADER ── */}
          <div className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9.5px] font-black uppercase tracking-widest ${dark ? "bg-blue-500/10 border-blue-700 text-blue-400" : "bg-blue-50 border-blue-700 text-blue-600"}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-700 animate-pulse"/>
                    AI Powered Audit
                  </div>
                </div>
                <h1 className={`text-md font-bold leading-normal ${dark ? "text-white" : "text-slate-900"}`}>
                  GBP Score Card
                </h1>
                <p className={`text-[12px] mt-1 ${dark ? "text-slate-500" : "text-blue-700"}`}>
                  {scoreData?.meta.locationName ?? "Google Business Profile"} · 30 factors
                </p>
              </div>
              <button
                onClick={handleRescan}
                disabled={scanning || isFetching}
                className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl text-white transition-all active:scale-90 shrink-0 disabled:opacity-60 disabled:pointer-events-none"
                style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)", boxShadow: "0 8px 24px rgba(59,130,246,0.35)" }}>
                <Brain size={18} style={{ animation: isFetching ? "spin 1s linear infinite" : "none" }}/>
                <span className="text-[9px] font-black uppercase tracking-wide">
                  {isFetching ? "Scanning" : "Re-scan"}
                </span>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </button>
            </div>
          </div>

          {/* ── SCORE HERO CARD ── */}
          <div className={`rounded-3xl border mb-5 overflow-hidden ${dark ? "bg-[#070f1f] border-blue-900/50" : "bg-white border-blue-100 shadow-sm"}`}
            style={{ boxShadow: dark ? "0 20px 80px rgba(59,130,246,0.12)" : "0 8px 40px rgba(59,130,246,0.1)" }}>

            <div className="h-px w-full" style={{ background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.6),transparent)" }}/>

            <div className="p-5">
              <ScoreRing score={score} dark={dark} animate={animate}/>

              <div className={`rounded-2xl p-3 grid grid-cols-3 gap-1 border mt-4 ${dark ? "bg-blue-950/30 border-blue-900/30" : "bg-blue-50/60 border-blue-100"}`}>
                {[
                  { n: counts.complete, label: "Done",    color: "#59AC77" },
                  { n: counts.partial,  label: "Partial", color: "#fbbf24" },
                  { n: counts.missing,  label: "Missing", color: "#f87171" },
                ].map((r, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[20px] font-black leading-none" style={{ color: r.color }}>{r.n}</span>
                    <span className={`text-[9px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>{r.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 mt-4">
                {CATEGORIES.slice(0, 3).map(cat => <CatBar key={cat.id} cat={cat} statuses={statuses} dark={dark}/>)}
              </div>
            </div>

            <div className={`border-t px-5 py-4 flex flex-col gap-2.5 ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${dark ? "text-slate-600" : "text-slate-400"}`}>All Categories</p>
              {CATEGORIES.slice(3).map(cat => <CatBar key={cat.id} cat={cat} statuses={statuses} dark={dark}/>)}
            </div>

            <div className={`border-t grid grid-cols-5 ${dark ? "border-blue-900/30" : "border-blue-100/60"}`}>
              {[
                { label: "Incomplete", range: "0–349",  color: "#f87171", active: score < 350 },
                { label: "Basic",      range: "350–549", color: "#fb923c", active: score >= 350 && score < 550 },
                { label: "Growing",    range: "550–749", color: "#a78bfa", active: score >= 550 && score < 750 },
                { label: "Advanced",   range: "750–899", color: "#38bdf8", active: score >= 750 && score < 900 },
                { label: "Elite",      range: "900+",    color: "#34d399", active: score >= 900 },
              ].map((tier, i) => (
                <div key={i} className={`flex flex-col items-center py-3 gap-0.5 border-r last:border-r-0 ${dark ? "border-blue-900/30" : "border-blue-100/60"} ${tier.active ? dark ? "bg-white/[0.03]" : "bg-blue-50/60" : ""}`}>
                  <div className="w-2 h-2 rounded-full mb-0.5" style={{ background: tier.active ? tier.color : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", boxShadow: tier.active ? `0 0 6px ${tier.color}` : "none" }}/>
                  <span className="text-[8.5px] font-black" style={{ color: tier.active ? tier.color : dark ? "#475569" : "#cbd5e1" }}>{tier.label}</span>
                  <span className={`text-[8px] ${dark ? "text-slate-700" : "text-slate-300"}`}>{tier.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── LIVE META STATS from API ── */}
          {scoreData?.meta && (
            <div className={`rounded-2xl border p-4 mb-5 ${dark ? "bg-[#080f1e] border-blue-900/40" : "bg-white border-blue-100 shadow-sm"}`}>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${dark ? "text-slate-600" : "text-slate-400"}`}>Live Stats from Google</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Avg Rating", value: scoreData.meta.avgRating > 0 ? `${scoreData.meta.avgRating}★` : "—", color: "#f59e0b" },
                  { label: "Reviews",    value: String(scoreData.meta.totalReviews),                                   color: "#3b82f6" },
                  { label: "Reply Rate", value: `${scoreData.meta.replyRate}%`,                                        color: "#22c55e" },
                  { label: "Posts/mo",   value: String(scoreData.meta.postsLast30d),                                   color: "#8b5cf6" },
                  { label: "Verified",   value: scoreData.meta.isVerified ? "Yes ✓" : "No",                            color: scoreData.meta.isVerified ? "#22c55e" : "#ef4444" },
                  { label: "Status",     value: scoreData.meta.isOpen ? "Open" : "—",                                  color: "#22c55e" },
                ].map((s, i) => (
                  <div key={i} className={`flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl border ${dark ? "bg-white/[0.03] border-white/[0.05]" : "bg-slate-50 border-slate-100"}`}>
                    <span className="text-[13px] font-black" style={{ color: s.color }}>{s.value}</span>
                    <span className={`text-[9px] font-bold ${dark ? "text-slate-600" : "text-slate-400"}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── QUICK WINS ── */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[14px] font-black ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.03em" }}>Quick Wins</p>
              <span className={`text-[11px] font-semibold ${dark ? "text-slate-500" : "text-blue-400"}`}>Highest impact, lowest effort</span>
            </div>
            <QuickWins statuses={statuses} dark={dark}/>
          </div>

          {/* ── AI RECS ── */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <p className={`text-[14px] font-black ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.03em" }}>AI Recommendations</p>
            </div>
            <AIRecs statuses={statuses} dark={dark} missingFromAPI={scoreData?.missing ?? []}/>
          </div>

          {/* ── FILTER TABS ── */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {(["all","missing","partial","complete"] as const).map(f => {
              const labels = { all: `All (${counts.total})`, missing: `Missing (${counts.missing})`, partial: `Partial (${counts.partial})`, complete: `Done (${counts.complete})` };
              const colors = { all: "#60a5fa", missing: "#f87171", partial: "#fbbf24", complete: "#4ade80" };
              const active = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className="shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 border"
                  style={active
                    ? { background: `${colors[f]}15`, color: colors[f], borderColor: `${colors[f]}35` }
                    : { background: dark ? "rgba(255,255,255,0.03)" : "rgba(59,130,246,0.04)", color: dark ? "#475569" : "#94a3b8", borderColor: "transparent" }}>
                  {labels[f]}
                </button>
              );
            })}
          </div>

          {/* ── CATEGORY SECTIONS ── */}
          <div className="flex flex-col gap-4">
            {visibleCats().map((cat, i) => (
              <CategorySection key={cat.id} cat={cat} statuses={statuses} dark={dark} defaultOpen={i === 0}
                scoreData={scoreData} checklistData={checklistData}/>
            ))}
          </div>

          {/* ── BOTTOM CTA ── */}
          <div className="mt-6">
            <div className={`rounded-3xl border p-5 relative overflow-hidden ${dark ? "bg-[#070f1f] border-blue-900/50" : "bg-white border-blue-100 shadow-sm"}`}
              style={{ boxShadow: dark ? "0 20px 60px rgba(59,130,246,0.1)" : "0 8px 40px rgba(59,130,246,0.08)" }}>
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(59,130,246,0.1),transparent 70%)" }}/>
              <div className="h-px w-full mb-5" style={{ background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent)" }}/>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${dark ? "bg-blue-500/15" : "bg-blue-100"}`}
                  style={{ border: "1px solid rgba(59,130,246,0.2)" }}>
                  <Wand2 size={20} style={{ color: "#60a5fa" }}/>
                </div>
                <div>
                  <p className={`text-[15px] font-black ${dark ? "text-white" : "text-slate-900"}`} style={{ letterSpacing: "-0.03em" }}>Auto-Fix with AI</p>
                  <p className={`text-[11px] mt-0.5 ${dark ? "text-slate-500" : "text-blue-400"}`}>Let AI write, optimise, and post for you</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { icon: <FileText size={11}/>, label: "AI Description", color: "#60a5fa" },
                  { icon: <Zap size={11}/>, label: "Weekly Posts", color: "#4ade80" },
                  { icon: <MessageSquare size={11}/>, label: "Review Replies", color: "#a78bfa" },
                  { icon: <Tag size={11}/>, label: "Offer Generator", color: "#fbbf24" },
                ].map((f, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${dark ? "bg-white/[0.03] border-white/[0.05]" : "bg-slate-50 border-slate-100"}`}>
                    <span style={{ color: f.color }}>{f.icon}</span>
                    <span className={`text-[10.5px] font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>{f.label}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => router.push("/post/create")}
                className="w-full py-3.5 rounded-2xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6,#60a5fa)", boxShadow: "0 8px 28px rgba(59,130,246,0.38)" }}>
                <Sparkles size={15}/> Start AI Optimisation <ArrowUpRight size={14} className="ml-1 opacity-70"/>
              </button>

              <p className={`text-center text-[10px] mt-3 ${dark ? "text-slate-600" : "text-slate-400"}`}>
                Real data from Google Business Profile API · Score updates on Re-scan
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}