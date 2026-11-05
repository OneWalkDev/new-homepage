import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // The portfolio's virtual files are hash navigation within this one page.
  return [{ url: "https://onewalk.dev/" }];
}
