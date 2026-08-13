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
  /** Normalized auction window */
  auctionStart: Date;
  auctionEnd: Date;
};

export type AuctionStatus = "upcoming" | "live" | "ended";

const HOUR_MS = 60 * 60 * 1000;

// Original timestamps are fixed in the past with no end dates. To simulate a
// live marketplace, we give auctions a fixed duration and spread their start
// times across a window centered on "now", preserving their original order.
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

// Appending the ID prevents slug collisions caused by duplicate vehicle titles.
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

export type FilterOptions = {
  makes: string[];
  titleStatuses: string[];
  bodyStyles: string[];
  years: number[];
};

export function getFilterOptions(): FilterOptions {
  return {
    makes: [...new Set(vehicles.map((v) => v.make))].sort(),
    titleStatuses: [...new Set(vehicles.map((v) => v.title_status))].sort(),
    bodyStyles: [...new Set(vehicles.map((v) => v.body_style))].sort(),
    years: [...new Set(vehicles.map((v) => v.year))].sort((a, b) => b - a),
  };
}

export type VehicleFilters = {
  make?: string[];
  titleStatus?: string[];
  bodyStyle?: string[];
  year?: string[];
};

export function filterVehicles(list: Vehicle[], filters: VehicleFilters): Vehicle[] {
  return list.filter((vehicle) => {
    if (filters.make?.length && !filters.make.includes(vehicle.make)) return false;
    if (filters.titleStatus?.length && !filters.titleStatus.includes(vehicle.title_status)) return false;
    if (filters.bodyStyle?.length && !filters.bodyStyle.includes(vehicle.body_style)) return false;
    if (filters.year?.length && !filters.year.includes(String(vehicle.year))) return false;
    return true;
  });
}

export type FilterOptionCount = {
  value: string;
  count: number;
};

export type FilterOptionCounts = {
  makes: FilterOptionCount[];
  titleStatuses: FilterOptionCount[];
  bodyStyles: FilterOptionCount[];
  years: FilterOptionCount[];
};

// Counts show a hypothetical intersection with OTHER filter groups, but
// a union within the SAME group. E.g., the "sedan" count applies active
// makes, but selecting a make doesn't filter out other option counts in Make.
export function getFilterOptionCounts(filters: VehicleFilters): FilterOptionCounts {
  const options = getFilterOptions();

  function countsFor(values: string[], key: keyof VehicleFilters): FilterOptionCount[] {
    return values.map((value) => ({
      value,
      count: filterVehicles(vehicles, { ...filters, [key]: [value] }).length,
    }));
  }

  return {
    makes: countsFor(options.makes, "make"),
    titleStatuses: countsFor(options.titleStatuses, "titleStatus"),
    bodyStyles: countsFor(options.bodyStyles, "bodyStyle"),
    years: countsFor(options.years.map(String), "year"),
  };
}
