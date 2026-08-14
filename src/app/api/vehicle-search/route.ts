import { type NextRequest, NextResponse } from "next/server";
import {
  getAuctionStatus,
  getEffectiveBidInfo,
  getVehicleSlug,
  searchVehicles,
  type AuctionStatus,
} from "@/lib/vehicles";

export type VehicleSuggestion = {
  slug: string;
  title: string;
  image: string;
  location: string;
  status: AuctionStatus;
  currentBid: number | null;
};

const SUGGESTION_LIMIT = 6;

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";

  const results: VehicleSuggestion[] = searchVehicles(query, SUGGESTION_LIMIT).map((vehicle) => {
    const { currentBid } = getEffectiveBidInfo(vehicle);
    return {
      slug: getVehicleSlug(vehicle),
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`,
      image: vehicle.images[0],
      location: `${vehicle.city}, ${vehicle.province}`,
      status: getAuctionStatus(vehicle),
      currentBid,
    };
  });

  return NextResponse.json({ results });
}
