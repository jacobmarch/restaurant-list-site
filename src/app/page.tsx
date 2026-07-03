import { Header } from "@/components/Header";
import { AddVisitForm } from "@/components/AddVisitForm";
import { Timeline } from "@/components/Timeline";
import type { Restaurant, RestaurantWithVisits } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, normalized_name, visits(id, visited_at, notes)")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  const restaurants: RestaurantWithVisits[] = (data ?? []).map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    visits: [...(restaurant.visits ?? [])].sort(
      (a, b) =>
        new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime(),
    ),
  }));

  const restaurantOptions: Restaurant[] = (data ?? []).map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    normalized_name: restaurant.normalized_name,
  }));

  return (
    <div className="min-h-full pb-safe">
      <Header />
      <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
        <AddVisitForm restaurants={restaurantOptions} />
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-stone-800">
            Our timeline
          </h2>
          <Timeline restaurants={restaurants} />
        </section>
      </main>
    </div>
  );
}
