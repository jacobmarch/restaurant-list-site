import { AddVisitForm } from "@/components/AddVisitForm";
import { RandomizerButton } from "@/components/RandomizerButton";
import { getRestaurants } from "@/lib/data";

export async function HomeContent() {
  const restaurants = await getRestaurants();

  return (
    <>
      <AddVisitForm restaurants={restaurants} />
      <RandomizerButton restaurants={restaurants} />
    </>
  );
}
