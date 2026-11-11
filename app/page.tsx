
"use client";

import { useEffect, useState } from "react";
import { usePetStore } from "@/store/petStore";
import AdoptionScreen from "@/components/AdoptionScreen";
import PetDashboard from "@/components/PetDashboard";

export default function Home() {
  const adoptedPet = usePetStore((state) => state.adoptedPet);
  const [hydrated, setHydrated] = useState(false);

 useEffect(() => {
  const hydrateStore = async () => {
    await usePetStore.persist.rehydrate();
    setHydrated(true);
  };

  hydrateStore();
}, []);

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">
        <p className="text-[#927F72]">Loading your little world...</p>
      </main>
    );
  }

  return adoptedPet ? <PetDashboard /> : <AdoptionScreen />;
}
