import Link from "next/link";
import { AddVisitForm } from "@/components/AddVisitForm";
import { RandomizerButton } from "@/components/RandomizerButton";
import type { Restaurant } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, normalized_name")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  const restaurantOptions: Restaurant[] = (data ?? []).map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    normalized_name: restaurant.normalized_name,
  }));

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <RandomizerButton restaurants={restaurantOptions} />
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-800">
          Add a visit
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Log a new restaurant memory while it&apos;s fresh.
        </p>
      </div>
      <AddVisitForm restaurants={restaurantOptions} />
      <Link
        href="/timeline"
        className="flex items-center justify-center gap-1 rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-50"
      >
        View our timeline
        <span aria-hidden>→</span>
      </Link>
    </main>
  );
}
