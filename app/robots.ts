import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  ? `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  : "https://dashportal.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/agency/*/dashboard/",
          "/auth/",
          "/onboarding/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
