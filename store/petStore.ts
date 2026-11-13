
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Pet } from "@/lib/petConfig";
import {
    getAccessoryItem,
    getConsumableItem,
    getShopItem,
    isAccessoryItem,
    PRIMARY_STAT,
    type EquipResult,
    type Inventory,
    type PurchaseResult,
    type UseItemResult,
} from "@/lib/shopConfig";
import {
    applyStatEffects,
    calculatePetStats,
    getAppliedEffects,
    getSleepDuration,
    isSleepComplete,
} from "@/lib/petEngine";

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

export interface DailyReward {
    day: number;
    coins: number;
    happiness: number;
}

export const DAILY_REWARDS: DailyReward[] = [
    { day: 1, coins: 10, happiness: 0 },
    { day: 2, coins: 0, happiness: 5 },
    { day: 3, coins: 20, happiness: 0 },
    { day: 4, coins: 15, happiness: 0 },
    { day: 5, coins: 0, happiness: 10 },
    { day: 6, coins: 30, happiness: 0 },
    { day: 7, coins: 50, happiness: 0 },
];

interface PetState {
    adoptedPet: AdoptedPet | null;

    coins: number;
    dailyStreak: number;
    lastDailyClaimDate: string | null;

    // Pet Shop
    inventory: Inventory;
    ownedAccessories: string[];
    equippedAccessory: string | null;

    adoptPet: (pet: Pet, customName: string) => void;

    updateStats: (
        stats: Partial<Pick<AdoptedPet, "hunger" | "happiness" | "energy">>
    ) => void;

    claimDailyReward: () => boolean;

    resetPet: () => void;
    startSleep: () => void;
    wakePet: () => void;

    purchaseItem: (itemId: string) => PurchaseResult;
    consumeItem: (itemId: string) => UseItemResult;
    equipAccessory: (itemId: string) => EquipResult;
    unequipAccessory: () => void;
}

/**
 * Apply decay / sleep recovery accrued since lastUpdatedAt. Any action that
 * resets lastUpdatedAt must settle first, or that elapsed time is lost.
 */
const settlePet = (pet: AdoptedPet, now: number): AdoptedPet => ({
    ...pet,
    ...(calculatePetStats(pet, now) ?? {}),
});

const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

/** Bump when the persisted shape changes; add a step to `migrate`. */
const STORE_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/** Drops unknown item ids and non-positive / non-integer quantities. */
const sanitizeInventory = (value: unknown): Inventory => {
    if (!isRecord(value)) return {};

    const inventory: Inventory = {};

    for (const [itemId, quantity] of Object.entries(value)) {
        if (
            getConsumableItem(itemId) &&
            typeof quantity === "number" &&
            Number.isInteger(quantity) &&
            quantity > 0
        ) {
            inventory[itemId] = quantity;
        }
    }

    return inventory;
};

const sanitizeOwnedAccessories = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];

    const valid = value.filter(
        (itemId): itemId is string =>
            typeof itemId === "string" && Boolean(getAccessoryItem(itemId))
    );

    return [...new Set(valid)];
};

const sanitizeEquippedAccessory = (
    value: unknown,
    ownedAccessories: string[]
): string | null =>
    typeof value === "string" && ownedAccessories.includes(value)
        ? value
        : null;

/**
 * With skipHydration, writing before rehydrate() finishes would overwrite the
 * saved game. Shop actions refuse to run until then.
 */
const isStoreReady = () => usePetStore.persist.hasHydrated();



export const usePetStore = create<PetState>()(
    persist(
        (set, get) => ({
            adoptedPet: null,

            coins: 0,
            dailyStreak: 0,
            lastDailyClaimDate: null,

            inventory: {},
            ownedAccessories: [],
            equippedAccessory: null,

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

            claimDailyReward: () => {
                const state = get();
                const pet = state.adoptedPet;

                if (!pet) return false;

                const now = new Date();
                const today = getLocalDateString(now);

                // Prevent multiple claims on the same day.
                if (state.lastDailyClaimDate === today) {
                    return false;
                }

                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);

                const yesterdayString = getLocalDateString(yesterday);

                const nextStreak =
                    state.lastDailyClaimDate === yesterdayString
                        ? state.dailyStreak + 1
                        : 1;

                const reward =
                    DAILY_REWARDS[(nextStreak - 1) % DAILY_REWARDS.length];

                const settled = settlePet(pet, now.getTime());

                set({
                    coins: state.coins + reward.coins,
                    dailyStreak: nextStreak,
                    lastDailyClaimDate: today,

                    adoptedPet: {
                        ...settled,
                        happiness: Math.min(
                            100,
                            settled.happiness + reward.happiness
                        ),
                        lastUpdatedAt: now.getTime(),
                    },
                });

                return true;
            },

            startSleep: () =>
                set((state) => {
                    if (!state.adoptedPet) return state;

                    const now = Date.now();

                    return {
                        adoptedPet: {
                            ...settlePet(state.adoptedPet, now),
                            isSleeping: true,
                            sleepUntil: now + getSleepDuration(),
                            lastUpdatedAt: now,
                        },
                    };
                }),

            wakePet: () =>
                set((state) => {
                    if (!state.adoptedPet) return state;

                    const now = Date.now();

                    return {
                        adoptedPet: {
                            // Keep the energy recovered since the last update.
                            ...settlePet(state.adoptedPet, now),
                            isSleeping: false,
                            sleepUntil: null,
                            lastUpdatedAt: now,
                        },
                    };
                }),

            purchaseItem: (itemId) => {
                if (!isStoreReady()) return { ok: false, reason: "NOT_READY" };

                const item = getShopItem(itemId);
                if (!item) return { ok: false, reason: "INVALID_ITEM" };

                const state = get();
                if (!state.adoptedPet) return { ok: false, reason: "NO_PET" };

                if (
                    isAccessoryItem(item) &&
                    state.ownedAccessories.includes(item.id)
                ) {
                    return { ok: false, reason: "ALREADY_OWNED" };
                }

                if (state.coins < item.price) {
                    return { ok: false, reason: "INSUFFICIENT_COINS" };
                }

                const coins = state.coins - item.price;

                if (isAccessoryItem(item)) {
                    set({
                        coins,
                        ownedAccessories: [...state.ownedAccessories, item.id],
                    });
                } else {
                    set({
                        coins,
                        inventory: {
                            ...state.inventory,
                            [item.id]: (state.inventory[item.id] ?? 0) + 1,
                        },
                    });
                }

                return { ok: true, item };
            },

            consumeItem: (itemId) => {
                if (!isStoreReady()) return { ok: false, reason: "NOT_READY" };

                const item = getConsumableItem(itemId);
                if (!item) return { ok: false, reason: "INVALID_ITEM" };

                const state = get();
                const pet = state.adoptedPet;
                if (!pet) return { ok: false, reason: "NO_PET" };

                const quantity = state.inventory[item.id] ?? 0;
                if (quantity <= 0) {
                    return { ok: false, reason: "NOT_IN_INVENTORY" };
                }

                const now = Date.now();
                const sleepFinished = isSleepComplete(pet, now);

                if (pet.isSleeping && !sleepFinished) {
                    return { ok: false, reason: "PET_SLEEPING" };
                }

                // Bring decay / sleep recovery up to date before applying the item,
                // so resetting lastUpdatedAt doesn't discard elapsed time.
                const current = calculatePetStats(pet, now) ?? {
                    hunger: pet.hunger,
                    happiness: pet.happiness,
                    energy: pet.energy,
                };

                const energyCost = Math.max(0, -(item.effects.energy ?? 0));
                if (current.energy < energyCost) {
                    return { ok: false, reason: "TOO_TIRED" };
                }

                if (current[PRIMARY_STAT[item.category]] >= 100) {
                    return { ok: false, reason: "STAT_FULL" };
                }

                const next = applyStatEffects(current, item.effects);

                const inventory = { ...state.inventory };
                if (quantity <= 1) {
                    delete inventory[item.id];
                } else {
                    inventory[item.id] = quantity - 1;
                }

                set({
                    inventory,
                    adoptedPet: {
                        ...pet,
                        ...next,
                        lastUpdatedAt: now,
                        ...(sleepFinished
                            ? { isSleeping: false, sleepUntil: null }
                            : {}),
                    },
                });

                return {
                    ok: true,
                    item,
                    applied: getAppliedEffects(current, next),
                };
            },

            equipAccessory: (itemId) => {
                if (!isStoreReady()) return { ok: false, reason: "NOT_READY" };

                const item = getAccessoryItem(itemId);
                if (!item) return { ok: false, reason: "INVALID_ITEM" };

                if (!get().ownedAccessories.includes(item.id)) {
                    return { ok: false, reason: "NOT_OWNED" };
                }

                set({ equippedAccessory: item.id });

                return { ok: true, item };
            },

            unequipAccessory: () => set({ equippedAccessory: null }),

            // Coins, inventory and accessories belong to the player, not the pet,
            // so they survive a reset.
            resetPet: () => set({ adoptedPet: null }),
        }),
        {
            name: "adopt-a-pixel-storage",
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
            version: STORE_VERSION,
            // v0 -> v1 only added shop fields; merge() below fills their
            // defaults, so persisted data passes through unchanged.
            migrate: (persistedState) => persistedState as PetState,
            merge: (persistedState, currentState) => {
                const persisted = (
                    isRecord(persistedState) ? persistedState : {}
                ) as Partial<PetState>;

                const ownedAccessories = sanitizeOwnedAccessories(
                    persisted.ownedAccessories
                );

                return {
                    ...currentState,
                    ...persisted,
                    inventory: sanitizeInventory(persisted.inventory),
                    ownedAccessories,
                    equippedAccessory: sanitizeEquippedAccessory(
                        persisted.equippedAccessory,
                        ownedAccessories
                    ),
                };
            },
        }
    )
    
);
