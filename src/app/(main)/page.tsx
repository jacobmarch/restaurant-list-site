import Link from "next/link";
import { AddVisitForm } from "@/components/AddVisitForm";
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
    <main className="mx-auto max-w-lg space-y-6 px-4 py-6">
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
