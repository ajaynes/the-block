import { vehicles } from "@/lib/vehicles";

export default function TestPage() {
  const firstVehicle = vehicles[0];

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
    </div>
  );
}
