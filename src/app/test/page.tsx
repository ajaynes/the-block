import { getAuctionStatus, vehicles } from "@/lib/vehicles";

export default function TestPage() {
  const firstVehicle = vehicles[0];

  const statusCounts = { upcoming: 0, live: 0, ended: 0 };
  for (const vehicle of vehicles) {
    statusCounts[getAuctionStatus(vehicle)]++;
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <p>{vehicles.length} vehicles</p>

      <h2>Vehicle 1</h2>
      <pre>
        {JSON.stringify(firstVehicle, null, 2)}
      </pre>

      <h2 style={{ marginTop: 50}}>First 10</h2>
      <ul>
        {vehicles.slice(0, 10).map((vehicle) => (
          <li key={vehicle.id}>
            {vehicle.lot} — {vehicle.year} {vehicle.make} {vehicle.model} (
            {vehicle.trim})
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: 50 }}>Auction status counts</h2>
      <ul>
        <li>upcoming: {statusCounts.upcoming}</li>
        <li>live: {statusCounts.live}</li>
        <li>ended: {statusCounts.ended}</li>
      </ul>

      <h2 style={{ marginTop: 50 }}>First 10 normalized</h2>
      <ul>
        {vehicles.slice(0, 10).map((vehicle) => (
          <li key={vehicle.id}>
            {vehicle.lot} — status: {getAuctionStatus(vehicle)} — start:{" "}
            {vehicle.auctionStart.toISOString()} — end:{" "}
            {vehicle.auctionEnd.toISOString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
