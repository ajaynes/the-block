import Image from "next/image";
import { notFound } from "next/navigation";
import { AuctionCountdown } from "@/components/AuctionCountdown";
import { VehicleCard } from "@/components/VehicleCard";
import { formatCurrency } from "@/lib/format";
import { getAuctionStatus, getEffectiveBidInfo, getRelatedVehicles, getVehicleBySlug } from "@/lib/vehicles";
import styles from "./page.module.css";

const RELATED_COUNT = 4;

export default async function VehicleDetailPage(props: PageProps<"/vehicles/[slug]">) {
  const { slug } = await props.params;
  const vehicle = getVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  const status = getAuctionStatus(vehicle);
  const hasEnded = status === "ended";
  const isLive = status === "live";
  const { currentBid, bidCount } = getEffectiveBidInfo(vehicle);
  const relatedVehicles = getRelatedVehicles(vehicle, RELATED_COUNT);

  return (
    <main className={styles.layout}>
      <div>
        <h1 className={`show-mobile ${styles.mobiletitle}`}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <div className={styles.gallery}>
          {vehicle.images.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} photo ${index + 1}`}
              width={280}
              height={210}
              unoptimized
              className={styles.galleryImage}
            />
          ))}
        </div>

        <table className={styles.specsTable}>
          <thead>
            <tr>
              <th colSpan={2}>Vehicle Information</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Trim</th>
              <td>{vehicle.trim}</td>
            </tr>
            <tr>
              <th scope="row">VIN</th>
              <td>{vehicle.vin}</td>
            </tr>
            <tr>
              <th scope="row">Body Style</th>
              <td>{vehicle.body_style}</td>
            </tr>
            <tr>
              <th scope="row">Exterior Color</th>
              <td>{vehicle.exterior_color}</td>
            </tr>
            <tr>
              <th scope="row">Interior Color</th>
              <td>{vehicle.interior_color}</td>
            </tr>
            <tr>
              <th scope="row">Engine</th>
              <td>{vehicle.engine}</td>
            </tr>
            <tr>
              <th scope="row">Transmission</th>
              <td>{vehicle.transmission}</td>
            </tr>
            <tr>
              <th scope="row">Drivetrain</th>
              <td>{vehicle.drivetrain}</td>
            </tr>
            <tr>
              <th scope="row">Odometer</th>
              <td>{vehicle.odometer_km.toLocaleString()} km</td>
            </tr>
            <tr>
              <th scope="row">Fuel Type</th>
              <td>{vehicle.fuel_type}</td>
            </tr>
            <tr>
              <th scope="row">Condition Grade</th>
              <td>{vehicle.condition_grade}</td>
            </tr>
            <tr>
              <th scope="row">Condition Report</th>
              <td>{vehicle.condition_report}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h1 className={`hide-mobile ${styles.title}`}>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <div className={`card ${styles.bidBox}`}>
          {hasEnded ? (
            <p className={styles.currentBid}>
              Final Bid:{" "}
              {currentBid === null ? "No bids placed" : formatCurrency(currentBid)}
            </p>
          ) : (
            <>
              <p className={styles.currentBid}>
                Current Bid:{" "}
                {currentBid === null ? "No bids yet" : formatCurrency(currentBid)}
              </p>
              <p className={styles.bidCount}>
                {bidCount} {bidCount === 1 ? "bid" : "bids"}
              </p>
            </>
          )}

          <AuctionCountdown
            auctionStart={vehicle.auctionStart.toISOString()}
            auctionEnd={vehicle.auctionEnd.toISOString()}
            finalBid={currentBid}
            variant="detail"
          />

          {isLive && (
            <div className={styles.bidRow}>
              <input
                type="number"
                min={(currentBid ?? vehicle.starting_bid) + 1}
                step={1}
                placeholder={`${formatCurrency((currentBid ?? vehicle.starting_bid) + 1)} or more`}
                aria-label="Bid amount"
              />
              <button type="button" className="btn btn-primary">
                Place Bid
              </button>
            </div>
          )}

          {status === "upcoming" && (
            <p className={styles.bidNotice}>Bidding opens when the auction starts.</p>
          )}

          {!hasEnded && (
            <p className={styles.bidMeta}>
              Starting Bid: {formatCurrency(vehicle.starting_bid)}
              {vehicle.buy_now_price !== null && <> · Buy Now: {formatCurrency(vehicle.buy_now_price)}</>}
            </p>
          )}
        </div>
        <table className={styles.specsTable}>
          <thead>
            <tr>
              <th colSpan={2}>Sales Information</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Sales Location</th>
              <td>{vehicle.city}, {vehicle.province}</td>
            </tr>
            <tr>
              <th scope="row">Seller</th>
              <td>{vehicle.selling_dealership}</td>
            </tr>
            <tr>
              <th scope="row">Lot</th>
              <td>{vehicle.lot}</td>
            </tr>
            <tr>
              <th scope="row">Title Status</th>
              <td>{vehicle.title_status}</td>
            </tr>
            <tr>
              <th scope="row">Damage Notes</th>
              <td>
                {vehicle.damage_notes.length > 0 ? (
                  <details>
                    <summary className={styles.damageSummary}>
                      {vehicle.damage_notes.length} {vehicle.damage_notes.length === 1 ? "item" : "items"}
                    </summary>
                    <ul className={styles.damageList}>
                      {vehicle.damage_notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <span className={styles.noDamage}>None reported</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>



        {relatedVehicles.length > 0 && (
          <div className={styles.related}>
            <h2 className={styles.relatedHeading}>Related Auctions</h2>
            <div className={styles.relatedGrid}>
              {relatedVehicles.map((related) => (
                <VehicleCard key={related.id} vehicle={related} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
