import Image from "next/image";
import { notFound } from "next/navigation";
import { AuctionCountdown } from "@/components/AuctionCountdown";
import { formatCurrency } from "@/lib/format";
import { getAuctionStatus, getVehicleBySlug } from "@/lib/vehicles";

export default async function VehicleDetailPage(props: PageProps<"/vehicles/[slug]">) {
  const { slug } = await props.params;
  const vehicle = getVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  const status = getAuctionStatus(vehicle);

  return (
    <main className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-8)" }}>
      <h1>
        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
      </h1>
      <p>Lot {vehicle.lot}</p>

      <p>
        <AuctionCountdown
          auctionStart={vehicle.auctionStart.toISOString()}
          auctionEnd={vehicle.auctionEnd.toISOString()}
          finalBid={vehicle.current_bid}
          variant="detail"
        />
      </p>

      <section style={{ marginTop: "var(--space-6)" }}>
        <h2>Photos</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
          {vehicle.images.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} photo ${index + 1}`}
              width={280}
              height={210}
              unoptimized
            />
          ))}
        </div>
      </section>

      <section style={{ marginTop: "var(--space-6)" }}>
        <h2>Auction</h2>
        <p>Status: {status}</p>
        <p>
          Current Bid:{" "}
          {vehicle.current_bid === null ? "No bids yet" : formatCurrency(vehicle.current_bid)}
        </p>
        <p>Starting Bid: {formatCurrency(vehicle.starting_bid)}</p>
        <p>Reserve Price: {formatCurrency(vehicle.reserve_price)}</p>
        <p>
          Buy Now Price:{" "}
          {vehicle.buy_now_price === null ? "N/A" : formatCurrency(vehicle.buy_now_price)}
        </p>
        <p>Bid Count: {vehicle.bid_count}</p>
      </section>

      <section style={{ marginTop: "var(--space-6)" }}>
        <h2>Specs</h2>
        <p>VIN: {vehicle.vin}</p>
        <p>Body Style: {vehicle.body_style}</p>
        <p>Exterior Color: {vehicle.exterior_color}</p>
        <p>Interior Color: {vehicle.interior_color}</p>
        <p>Engine: {vehicle.engine}</p>
        <p>Transmission: {vehicle.transmission}</p>
        <p>Drivetrain: {vehicle.drivetrain}</p>
        <p>Odometer: {vehicle.odometer_km.toLocaleString()} km</p>
        <p>Fuel Type: {vehicle.fuel_type}</p>
      </section>

      <section style={{ marginTop: "var(--space-6)" }}>
        <h2>Condition</h2>
        <p>Grade: {vehicle.condition_grade}</p>
        <p>Title Status: {vehicle.title_status}</p>
        <p>{vehicle.condition_report}</p>
        {vehicle.damage_notes.length > 0 && (
          <>
            <h3>Damage Notes</h3>
            <ul>
              {vehicle.damage_notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section style={{ marginTop: "var(--space-6)" }}>
        <h2>Location &amp; Seller</h2>
        <p>{vehicle.city}, {vehicle.province}</p>
        <p>Selling Dealership: {vehicle.selling_dealership}</p>
      </section>
    </main>
  );
}
