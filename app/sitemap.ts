import type { MetadataRoute } from "next";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [];
}
