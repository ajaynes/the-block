import Image from "next/image";
import Link from "next/link";
import { AuctionCountdown } from "@/components/AuctionCountdown";
import { WatchlistButton } from "@/components/WatchlistButton";
import { formatCurrency } from "@/lib/format";
import { getAuctionStatus, getEffectiveBidInfo, getVehicleSlug, type Vehicle } from "@/lib/vehicles";
import styles from "./VehicleCard.module.css";

type Props = {
  vehicle: Vehicle;
  /** Stacks the action buttons vertically on desktop — for narrower grids
   *  (e.g. the PDP's related-auctions rail) where side-by-side buttons
   *  don't have enough room to breathe. */
  stackActions?: boolean;
};

export function VehicleCard({ vehicle, stackActions }: Props) {
  const status = getAuctionStatus(vehicle);
  const hasEnded = status === "ended";
  const isUpcoming = status === "upcoming";
  const { currentBid } = getEffectiveBidInfo(vehicle);
  const detailHref = `/vehicles/${getVehicleSlug(vehicle)}`;

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.imageWrapper}>
        <Image
          src={vehicle.images[0]}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          width={600}
          height={600}
          unoptimized
        />
        <div className={styles.timerOverlay}>
          <AuctionCountdown
            auctionStart={vehicle.auctionStart.toISOString()}
            auctionEnd={vehicle.auctionEnd.toISOString()}
            finalBid={currentBid}
          />
        </div>
      </div>
      <div className={styles.body}>
      <p>
        <Link href={detailHref} className="stretched-link card-title">
          {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
        </Link>
      </p>
      <p>
        <span className="text-label">Odometer: {vehicle.odometer_km.toLocaleString('en-CA')}</span>
      </p>
      {hasEnded ? (
        <p><span className="text-label">Final Bid:</span> <strong>{currentBid === null ? "No bids placed" : formatCurrency(currentBid)}</strong></p>
      ) : (
        !isUpcoming && (
          <p>
            <span className="text-label">{currentBid !== null ? "Current Bid:" : "Starting Bid:"}</span>{" "}
            <strong>{formatCurrency(currentBid ?? vehicle.starting_bid)}</strong>
          </p>
        )
      )}
      <div className={`${styles.actions} ${stackActions ? styles.actionsStacked : ""}`}>
        {hasEnded ? (
          <Link
            href={detailHref}
            className={`btn btn-primary ${styles.actionButton} ${styles.viewDetailsButton}`}
            style={{ width: "100%" }}
          >
            View Details
          </Link>
        ) : (
          <>
            <Link href={detailHref} className={`btn btn-primary ${styles.actionButton}`}>
              Bid Now
            </Link>
            <WatchlistButton vehicleId={vehicle.id} className={styles.actionButton} />
          </>
        )}
      </div>
      </div>
    </div>
  );
}
