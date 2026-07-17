import { AppDataProvider } from "@/components/AppDataProvider";
import { getRestaurants, getTimelineVisits } from "@/lib/data";

export async function AppDataShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [restaurants, visits] = await Promise.all([
    getRestaurants(),
    getTimelineVisits(),
  ]);

  return (
    <AppDataProvider
      initialRestaurants={restaurants}
      initialVisits={visits}
    >
      {children}
    </AppDataProvider>
  );
}
