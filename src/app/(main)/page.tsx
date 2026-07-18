"use client";

import { AddVisitForm } from "@/components/AddVisitForm";
import { useAppData } from "@/components/AppDataProvider";
import { RandomizerButton } from "@/components/RandomizerButton";

export default function HomePage() {
  const { restaurants } = useAppData();

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-800">
          Add a visit
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Log a new restaurant visit and take a picture pls 😊
     
        </p>
      </div>
      <AddVisitForm restaurants={restaurants} />
      <RandomizerButton />
    </main>
  );
}
