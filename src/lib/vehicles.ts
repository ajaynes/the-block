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
  auctionStatus?: string[];
};

export function filterVehicles(list: Vehicle[], filters: VehicleFilters): Vehicle[] {
  const now = new Date();
  return list.filter((vehicle) => {
    if (filters.make?.length && !filters.make.includes(vehicle.make)) return false;
    if (filters.titleStatus?.length && !filters.titleStatus.includes(vehicle.title_status)) return false;
    if (filters.bodyStyle?.length && !filters.bodyStyle.includes(vehicle.body_style)) return false;
    if (filters.year?.length && !filters.year.includes(String(vehicle.year))) return false;
    if (filters.auctionStatus?.length && !filters.auctionStatus.includes(getAuctionStatus(vehicle, now))) {
      return false;
    }
    return true;
  });
}

export type FilterOptionCount = {
  value: string;
  label?: string;
  count: number;
};

// Maps UI labels (e.g., "Active") to internal `AuctionStatus` enum
// values ("live"/"upcoming"/"ended") for URL routing and matching.
const AUCTION_STATUS_VALUES: AuctionStatus[] = ["live", "upcoming", "ended"];
const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  live: "Active",
  upcoming: "Upcoming",
  ended: "Ended",
};

export type FilterOptionCounts = {
  auctionStatuses: FilterOptionCount[];
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
    auctionStatuses: AUCTION_STATUS_VALUES.map((value) => ({
      value,
      label: AUCTION_STATUS_LABELS[value],
      count: filterVehicles(vehicles, { ...filters, auctionStatus: [value] }).length,
    })),
    makes: countsFor(options.makes, "make"),
    titleStatuses: countsFor(options.titleStatuses, "titleStatus"),
    bodyStyles: countsFor(options.bodyStyles, "bodyStyle"),
    years: countsFor(options.years.map(String), "year"),
  };
}

export type SortOption = "ending-soonest" | "price-low" | "price-high" | "alphabetical";

const STATUS_PRIORITY: Record<AuctionStatus, number> = {
  live: 0,
  upcoming: 1,
  ended: 2,
};

// "Ending soonest" prioritizes active buyers: live auctions closing first,
// followed by upcoming auctions starting next, with ended auctions pushed
// to the absolute bottom.
function compareEndingSoonest(a: Vehicle, b: Vehicle, now: Date): number {
  const statusA = getAuctionStatus(a, now);
  const statusB = getAuctionStatus(b, now);

  if (statusA !== statusB) {
    return STATUS_PRIORITY[statusA] - STATUS_PRIORITY[statusB];
  }
  if (statusA === "upcoming") {
    return a.auctionStart.getTime() - b.auctionStart.getTime();
  }
  if (statusA === "ended") {
    return b.auctionEnd.getTime() - a.auctionEnd.getTime();
  }
  return a.auctionEnd.getTime() - b.auctionEnd.getTime();
}

// Vehicles with no bids yet (current_bid: null) sort as the lowest price —
// first in low-to-high, last in high-to-low — rather than being excluded
// or treated as $0, which could tie with an actual $0 bid.
function priceValue(vehicle: Vehicle): number {
  return vehicle.current_bid ?? -Infinity;
}

export function sortVehicles(list: Vehicle[], sort: SortOption | undefined): Vehicle[] {
  const sorted = [...list];

  switch (sort) {
    case "price-low":
      return sorted.sort((a, b) => priceValue(a) - priceValue(b));
    case "price-high":
      return sorted.sort((a, b) => priceValue(b) - priceValue(a));
    case "alphabetical":
      return sorted.sort((a, b) =>
        `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`),
      );
    case "ending-soonest": {
      const now = new Date();
      return sorted.sort((a, b) => compareEndingSoonest(a, b, now));
    }
    default:
      return sorted;
  }
}
