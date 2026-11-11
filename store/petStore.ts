
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Pet } from "@/lib/petConfig";

export interface AdoptedPet extends Pet {
    customName: string;
    hunger: number;
    happiness: number;
    energy: number;
    age: number;
    adoptedAt: number;
    lastUpdatedAt: number;
    sleepUntil: number | null;
    isSleeping: boolean;
}

interface PetState {
    adoptedPet: AdoptedPet | null;

    adoptPet: (pet: Pet, customName: string) => void;

    updateStats: (
        stats: Partial<Pick<AdoptedPet, "hunger" | "happiness" | "energy">>
    ) => void;

    resetPet: () => void;
    startSleep: () => void;
    wakePet: () => void;
}

export const usePetStore = create<PetState>()(
    persist(
        (set) => ({
            adoptedPet: null,

            adoptPet: (pet, customName) =>
                set({
                    adoptedPet: {
                        ...pet,
                        customName,
                        hunger: 80,
                        happiness: 80,
                        energy: 100,
                        age: 0,
                        adoptedAt: Date.now(),
                        lastUpdatedAt: Date.now(),
                        sleepUntil: null,
                        isSleeping: false,
                    },
                }),

            updateStats: (stats) =>
                set((state) => ({
                    adoptedPet: state.adoptedPet
                        ? {
                            ...state.adoptedPet,
                            ...stats,
                            lastUpdatedAt: Date.now(),
                        }
                        : null,
                })),

            startSleep: () =>
                set((state) => {
                    if (!state.adoptedPet) return state;

                    const now = Date.now();

                    return {
                        adoptedPet: {
                            ...state.adoptedPet,
                            isSleeping: true,
                            sleepUntil: now + 30 * 60 * 1000,
                            lastUpdatedAt: now,
                        },
                    };
                }),

            wakePet: () =>
                set((state) => {
                    if (!state.adoptedPet) return state;

                    return {
                        adoptedPet: {
                            ...state.adoptedPet,
                            isSleeping: false,
                            sleepUntil: null,
                            lastUpdatedAt: Date.now(),
                        },
                    };
                }),

            resetPet: () => set({ adoptedPet: null }),
        }),
        {
            name: "adopt-a-pixel-storage",
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
        }
    )
);
