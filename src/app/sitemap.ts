import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getVehicleSlug, vehicles } from "@/lib/vehicles";

export default function sitemap(): MetadataRoute.Sitemap {
  const vehicleEntries: MetadataRoute.Sitemap = vehicles.map((vehicle) => ({
    url: `${SITE_URL}/vehicles/${getVehicleSlug(vehicle)}`,
    lastModified: vehicle.auctionStart,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
    },
    ...vehicleEntries,
  ];
}
