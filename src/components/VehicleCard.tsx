import Image from "next/image";
import Link from "next/link";
import { AuctionCountdown } from "@/components/AuctionCountdown";
import { WatchlistButton } from "@/components/WatchlistButton";
import { formatCurrency } from "@/lib/format";
import { getAuctionStatus, getEffectiveBidInfo, getVehicleSlug, type Vehicle } from "@/lib/vehicles";
import styles from "./VehicleCard.module.css";

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
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
        {vehicle.city}, {vehicle.province}
      </p>
      {hasEnded ? (
        <p>Final Bid: {currentBid === null ? "No bids placed" : formatCurrency(currentBid)}</p>
      ) : (
        !isUpcoming && (
          <p>
            <span className="text-label">{currentBid !== null ? "Current Bid:" : "Starting Bid:"}</span>{" "}
            <strong>{formatCurrency(currentBid ?? vehicle.starting_bid)}</strong>
          </p>
        )
      )}
      {!hasEnded && (
        <div className={styles.actions}>
          <Link href={detailHref} className={`btn btn-primary ${styles.actionButton}`}>
            Bid Now
          </Link>
          <WatchlistButton vehicleId={vehicle.id} className={styles.actionButton} />
        </div>
      )}
      </div>
    </div>
  );
}
