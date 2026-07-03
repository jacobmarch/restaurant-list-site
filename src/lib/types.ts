export type Restaurant = {
  id: string;
  name: string;
  normalized_name: string;
};

export type Visit = {
  id: string;
  visited_at: string;
  notes: string | null;
};

export type RestaurantWithVisits = {
  id: string;
  name: string;
  visits: Visit[];
};

export type AddVisitState = {
  success?: boolean;
  error?: string;
};
