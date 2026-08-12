import rawVehicles from "../../data/vehicles.json";

type RawVehicle = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  body_style: string;
  exterior_color: string;
  interior_color: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  odometer_km: number;
  fuel_type: string;
  condition_grade: number;
  condition_report: string;
  damage_notes: string[];
  title_status: string;
  province: string;
  city: string;
  auction_start: string;
  starting_bid: number;
  reserve_price: number;
  buy_now_price: number | null;
  images: string[];
  selling_dealership: string;
  lot: string;
  current_bid: number | null;
  bid_count: number;
};

export type Vehicle = RawVehicle & {
  /** Normalized auction window — see note above normalizeVehicles(). */
  auctionStart: Date;
  auctionEnd: Date;
};

export type AuctionStatus = "upcoming" | "live" | "ended";

const HOUR_MS = 60 * 60 * 1000;

// The dataset's auction_start timestamps are synthetic and fixed to whenever
// the data was generated, so by the time this app runs they're all in the
// past — nothing would ever look "live". There's no auction_end in the data
// either, so we invent both: give every auction a fixed duration, then
// spread the 200 original start times (preserving their relative order)
// across a window centered on "now" (app start), so the marketplace shows a
// believable mix of upcoming, live, and ended auctions.
const AUCTION_DURATION_HOURS = 24;
const WINDOW_DAYS_BEFORE_NOW = 4;
const WINDOW_DAYS_AFTER_NOW = 4;

function normalizeVehicles(raw: RawVehicle[]): Vehicle[] {
  const referenceNow = Date.now();
  const windowStartMs = referenceNow - WINDOW_DAYS_BEFORE_NOW * 24 * HOUR_MS;
  const windowEndMs = referenceNow + WINDOW_DAYS_AFTER_NOW * 24 * HOUR_MS;

  const rankByOriginalIndex = new Map<number, number>();
  raw
    .map((vehicle, index) => ({ index, auction_start: vehicle.auction_start }))
    .sort((a, b) => a.auction_start.localeCompare(b.auction_start))
    .forEach(({ index }, rank) => rankByOriginalIndex.set(index, rank));

  const count = raw.length;

  return raw.map((vehicle, index) => {
    const rank = rankByOriginalIndex.get(index) ?? 0;
    const t = count > 1 ? rank / (count - 1) : 0;
    const auctionStart = new Date(windowStartMs + t * (windowEndMs - windowStartMs));
    const auctionEnd = new Date(auctionStart.getTime() + AUCTION_DURATION_HOURS * HOUR_MS);

    return { ...vehicle, auctionStart, auctionEnd };
  });
}

export const vehicles: Vehicle[] = normalizeVehicles(rawVehicles as RawVehicle[]);

export function getVehicleById(id: string): Vehicle | undefined {
  return vehicles.find((vehicle) => vehicle.id === id);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Titles alone aren't unique — the dataset has 13 repeated
// year/make/model/trim combos (e.g. two "2017 Volkswagen Golf GTI SE"). The
// id suffix guarantees the slug always resolves to exactly one vehicle.
export function getVehicleSlug(vehicle: Vehicle): string {
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;
  return `${slugify(title)}-${vehicle.id}`;
}

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getVehicleBySlug(slug: string): Vehicle | undefined {
  const id = slug.match(UUID_PATTERN)?.[0];
  return id ? getVehicleById(id) : undefined;
}

export function getAuctionStatus(vehicle: Vehicle, now: Date = new Date()): AuctionStatus {
  if (now < vehicle.auctionStart) return "upcoming";
  if (now < vehicle.auctionEnd) return "live";
  return "ended";
}
