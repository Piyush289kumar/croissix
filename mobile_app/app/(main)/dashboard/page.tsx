// mobile_app\app\(main)\dashboard\page.tsx

"use client";

import { useEffect, useState } from "react";

interface Location {
  name: string;
  title: string;
  websiteUri?: string;
  phoneNumbers?: {
    primaryPhone?: string;
  };
}

export default function DashboardPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch("/api/google/locations");
      const data = await res.json();

      setLocations(data.locations || []);
    } catch (error) {
      console.error("Failed to load locations", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1421] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">
        Google Business Dashboard
      </h1>

      {locations.length === 0 && (
        <div className="bg-[#131c2d] p-6 rounded-xl border border-white/10">
          No Google Business locations found.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((loc) => (
          <div
            key={loc.name}
            className="bg-[#131c2d] border border-white/10 rounded-xl p-5"
          >
            <h2 className="text-lg font-semibold mb-2">
              {loc.title}
            </h2>

            {loc.phoneNumbers?.primaryPhone && (
              <p className="text-sm text-gray-400">
                📞 {loc.phoneNumbers.primaryPhone}
              </p>
            )}

            {loc.websiteUri && (
              <a
                href={loc.websiteUri}
                target="_blank"
                className="text-blue-400 text-sm mt-2 block"
              >
                Visit Website
              </a>
            )}

            <a
              href={`/dashboard/reviews?location=${encodeURIComponent(
                loc.name
              )}`}
              className="mt-4 inline-block bg-blue-600 px-4 py-2 rounded-lg text-sm"
            >
              View Reviews
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}