import { Timeline } from "@/components/Timeline";
import { getTimelineVisits } from "@/lib/data";

export async function TimelineContent() {
  const visits = await getTimelineVisits();

  return <Timeline visits={visits} />;
}
