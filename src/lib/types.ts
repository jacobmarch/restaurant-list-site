export type Restaurant = {
  id: string;
  name: string;
  normalized_name: string;
};

export type Visit = {
  id: string;
  visited_at: string;
  notes: string | null;
  image_path: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number;
};

export type RestaurantWithVisits = {
  id: string;
  name: string;
  visits: Visit[];
};

export type TimelineVisit = {
  id: string;
  restaurant_id: string;
  restaurantName: string;
  visited_at: string;
  notes: string | null;
  image_path: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  rating: number;
};

export type AddVisitState = {
  success?: boolean;
  error?: string;
  visitId?: string;
};
