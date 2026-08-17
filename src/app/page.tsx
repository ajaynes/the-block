import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, type FilterGroupKey } from "@/components/FilterBar";
import { VehicleCard } from "@/components/VehicleCard";
import {
  filterVehicles,
  getFilterOptionCounts,
  sortVehicles,
  vehicles,
  type SortOption,
} from "@/lib/vehicles";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Shop Vehicle Auctions",
  description:
    "Search and filter live, upcoming, and ended vehicle auctions by make, body style, title status, and year.",
};

const PAGE_SIZE = 12;
const SORT_OPTIONS: SortOption[] = ["ending-soonest", "price-low", "price-high", "alphabetical"];

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : 1;
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function parseSort(value: string | string[] | undefined): SortOption | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return SORT_OPTIONS.find((option) => option === raw);
}

function parseSearch(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export default async function Home(props: PageProps<"/">) {
  const params = await props.searchParams;

  const selected: Record<FilterGroupKey, string[]> = {
    auctionStatus: toArray(params.auctionStatus),
    make: toArray(params.make),
    status: toArray(params.status),
    body: toArray(params.body),
    year: toArray(params.year),
  };

  const sort = parseSort(params.sort);
  // Ending soonest is the default sort when the URL doesn't specify one.
  const effectiveSort = sort ?? "ending-soonest";
  const search = parseSearch(params.q);

  const filteredVehicles = sortVehicles(
    filterVehicles(vehicles, {
      auctionStatus: selected.auctionStatus,
      make: selected.make,
      titleStatus: selected.status,
      bodyStyle: selected.body,
      year: selected.year,
      search,
    }),
    effectiveSort,
  );

  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / PAGE_SIZE));
  const page = Math.min(Math.max(parsePage(params.page), 1), totalPages);

  const start = (page - 1) * PAGE_SIZE;
  const pageVehicles = filteredVehicles.slice(start, start + PAGE_SIZE);

  const optionCounts = getFilterOptionCounts({
    auctionStatus: selected.auctionStatus,
    make: selected.make,
    titleStatus: selected.status,
    bodyStyle: selected.body,
    year: selected.year,
    search,
  });
  const filterGroups = [
    { key: "auctionStatus" as const, label: "Auction Status", options: optionCounts.auctionStatuses },
    { key: "make" as const, label: "Make", options: optionCounts.makes },
    { key: "status" as const, label: "Title Status", options: optionCounts.titleStatuses },
    { key: "body" as const, label: "Body Style", options: optionCounts.bodyStyles },
    { key: "year" as const, label: "Year", options: optionCounts.years },
  ];

  const pageHref = (targetPage: number) => {
    const linkParams = new URLSearchParams();
    for (const group of filterGroups) {
      for (const value of selected[group.key]) {
        linkParams.append(group.key, value);
      }
    }
    if (sort) linkParams.set("sort", sort);
    if (search) linkParams.set("q", search);
    if (targetPage > 1) linkParams.set("page", String(targetPage));
    return linkParams.toString() ? `/?${linkParams.toString()}` : "/";
  };

  const clearSearchHref = (() => {
    const linkParams = new URLSearchParams();
    for (const group of filterGroups) {
      for (const value of selected[group.key]) {
        linkParams.append(group.key, value);
      }
    }
    if (sort) linkParams.set("sort", sort);
    return linkParams.toString() ? `/?${linkParams.toString()}` : "/";
  })();

  return (
    <>
      <h1 className={styles.pageHeading}>Vehicle Auctions</h1>
      <div className={styles.layout}>
      <FilterBar groups={filterGroups} selected={selected} sort={effectiveSort}>
        {search && (
          <p className={styles.searchNotice}>
            Search results for &ldquo;{search}&rdquo; ({filteredVehicles.length}){" "}
            <Link href={clearSearchHref}>Clear search</Link>
          </p>
        )}
        <div className={styles.page}>
          {pageVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        {pageVehicles.length === 0 && (
          <p className={styles.emptyState}>No vehicles match the selected filters.</p>
        )}

        <nav className={styles.pagination} aria-label="Pagination">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="btn btn-secondary">Previous</Link>
          ) : (
            <span className="btn btn-secondary" aria-disabled="true">Previous</span>
          )}

          <span>Page {page} of {totalPages}</span>

          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="btn btn-secondary">Next</Link>
          ) : (
            <span className="btn btn-secondary" aria-disabled="true">Next</span>
          )}
        </nav>
      </FilterBar>
      </div>
    </>
  );
}
