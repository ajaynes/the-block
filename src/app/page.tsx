import Image from "next/image";
import Link from "next/link";
import { vehicles } from "@/lib/vehicles";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="card">
            <Image src={vehicle.images[0]} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} width={600} height={600} unoptimized />
            <p>{vehicle.year} {vehicle.make} {vehicle.model}</p>
            <p>{vehicle.trim}</p>
            <p>{vehicle.city}, {vehicle.province}</p>
            <p>Current Bid: {vehicle.current_bid}</p>
            <p>Starting Bid: {vehicle.starting_bid}</p>
            <p>Auction Start: {vehicle.auction_start}</p>
            <Link href="#" className="btn">Bid Now</Link>
          </div>
        ))}
    </div>
  );
}
