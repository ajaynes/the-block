import Image from "next/image";
import Link from "next/link";
import { AuctionCountdown } from "@/components/AuctionCountdown";
import { formatCurrency } from "@/lib/format";
import { getAuctionStatus, getVehicleSlug, vehicles } from "@/lib/vehicles";
import styles from "./page.module.css";

const PAGE_SIZE = 16;

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : 1;
}

export default async function Home(props: PageProps<"/">) {
  const { page: pageParam } = await props.searchParams;

  const totalPages = Math.max(1, Math.ceil(vehicles.length / PAGE_SIZE));
  const page = Math.min(Math.max(parsePage(pageParam), 1), totalPages);

  const start = (page - 1) * PAGE_SIZE;
  const pageVehicles = vehicles.slice(start, start + PAGE_SIZE);

  return (
    <>
      <div className={styles.page}>
        {pageVehicles.map((vehicle) => {
          const hasEnded = getAuctionStatus(vehicle) === "ended";

          const detailHref = `/vehicles/${getVehicleSlug(vehicle)}`;

          return (
            <div key={vehicle.id} className="card">
              <div className={styles.imageWrapper}>
                <Image src={vehicle.images[0]} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} width={600} height={600} unoptimized />
                <div className={styles.timerOverlay}>
                  <AuctionCountdown
                    auctionStart={vehicle.auctionStart.toISOString()}
                    auctionEnd={vehicle.auctionEnd.toISOString()}
                    finalBid={vehicle.current_bid}
                  />
                </div>
              </div>
              <p>
                <Link href={detailHref} className="stretched-link">
                  {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                </Link>
              </p>
              <p>{vehicle.city}, {vehicle.province}</p>
              {hasEnded ? (
                <p>
                  Final Bid:{" "}
                  {vehicle.current_bid === null ? "No bids placed" : formatCurrency(vehicle.current_bid)}
                </p>
              ) : (
                <>
                  <p>
                    Current Bid:{" "}
                    {vehicle.current_bid === null ? "No bids yet" : formatCurrency(vehicle.current_bid)}
                  </p>
                  <p>Starting Bid: {formatCurrency(vehicle.starting_bid)}</p>
                </>
              )}
              {!hasEnded && (
                <Link href={detailHref} className="btn">Bid Now</Link>
              )}
            </div>
          );
        })}
      </div>

      <nav className={styles.pagination} aria-label="Pagination">
        {page > 1 ? (
          <Link href={`/?page=${page - 1}`} className="btn btn-secondary">Previous</Link>
        ) : (
          <span className="btn btn-secondary" aria-disabled="true">Previous</span>
        )}

        <span>Page {page} of {totalPages}</span>

        {page < totalPages ? (
          <Link href={`/?page=${page + 1}`} className="btn btn-secondary">Next</Link>
        ) : (
          <span className="btn btn-secondary" aria-disabled="true">Next</span>
        )}
      </nav>
    </>
  );
}
