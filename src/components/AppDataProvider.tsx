"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { loadAppData } from "@/app/actions/data";
import type { Restaurant, TimelineVisit } from "@/lib/types";

type AppDataContextValue = {
  restaurants: Restaurant[];
  visits: TimelineVisit[];
  refresh: () => void;
  isRefreshing: boolean;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

type AppDataProviderProps = {
  initialRestaurants: Restaurant[];
  initialVisits: TimelineVisit[];
  children: React.ReactNode;
};

export function AppDataProvider({
  initialRestaurants,
  initialVisits,
  children,
}: AppDataProviderProps) {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [visits, setVisits] = useState(initialVisits);
  const [isRefreshing, startRefresh] = useTransition();

  const refresh = useCallback(() => {
    startRefresh(async () => {
      const data = await loadAppData();
      setRestaurants(data.restaurants);
      setVisits(data.visits);
    });
  }, []);

  const value = useMemo(
    () => ({ restaurants, visits, refresh, isRefreshing }),
    [restaurants, visits, refresh, isRefreshing],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return context;
}
