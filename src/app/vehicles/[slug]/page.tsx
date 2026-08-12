import { notFound } from "next/navigation";
import { getVehicleBySlug } from "@/lib/vehicles";

export default async function VehicleDetailPage(props: PageProps<"/vehicles/[slug]">) {
  const { slug } = await props.params;
  const vehicle = getVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1>
        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
      </h1>
    </main>
  );
}
