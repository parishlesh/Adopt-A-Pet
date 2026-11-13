
import type { AdoptedPet } from "@/store/petStore";
import type { StatEffects, StatKey } from "@/lib/shopConfig";

const DECAY_RATES = {
  hunger: 10,
  happiness: 20,
};



const SLEEP_DURATION = 30 * 60 * 1000;
const TEST_SLEEP_DURATION = 60 * 1000;

// Set to true while testing (1-minute sleep, 10-second mini-game).
export const TEST_MODE = false;

export const getSleepDuration = () =>
  TEST_MODE ? TEST_SLEEP_DURATION : SLEEP_DURATION;


export function calculatePetStats(
  pet: AdoptedPet,
  currentTime = Date.now()
) {
  const lastUpdated = pet.lastUpdatedAt ?? pet.adoptedAt;

  const elapsedMinutes = Math.max(
    0,
    (currentTime - lastUpdated) / 60000
  );

  if (elapsedMinutes < 0.01) return null;

  // Hunger and happiness decrease over time.
  const hunger = Math.max(
    0,
    pet.hunger - elapsedMinutes / DECAY_RATES.hunger
  );

  const happiness = Math.max(
    0,
    pet.happiness - elapsedMinutes / DECAY_RATES.happiness
  );

  // Energy recovers only during the actual sleep period.
  let energy = pet.energy;

  if (pet.isSleeping && pet.sleepUntil) {
    const recoveryEnd = Math.min(currentTime, pet.sleepUntil);

    const recoveryMinutes = Math.max(
      0,
      (recoveryEnd - lastUpdated) / 60000
    );

    energy = Math.min(
      100,
      energy + recoveryMinutes * (100 / (getSleepDuration() / 60000))
    );

    // If the sleep ended before this update (e.g. the browser was closed),
    // the pet has been awake since sleepUntil: apply normal decay for that time.
    const awakeMinutes = Math.max(
      0,
      (currentTime - Math.max(pet.sleepUntil, lastUpdated)) / 60000
    );

    energy = Math.max(0, energy - awakeMinutes / 30);
  } else {
    // Normal energy decay when awake.
    energy = Math.max(
      0,
      energy - elapsedMinutes / 30
    );
  }

  return {
    hunger,
    happiness,
    energy,
  };
}

export function isSleepComplete(pet: AdoptedPet, currentTime = Date.now()) {
  return Boolean(
    pet.isSleeping &&
    pet.sleepUntil &&
    currentTime >= pet.sleepUntil
  );
}

export function getPetMood(pet: AdoptedPet) {
    if (pet.hunger <= 20 || pet.happiness <= 20 || pet.energy <= 15) {
        return "Exhausted";
    }

    if (pet.hunger <= 35) return "Hungry";

    if (pet.energy <= 30) return "Sleepy";

    if (pet.happiness <= 35) return "Sad";

    if (
        pet.hunger >= 70 &&
        pet.happiness >= 70 &&
        pet.energy >= 70
    ) {
        return "Happy";
    }

    return "Okay";
}


export function getPetGrowth(adoptedAt: number) {
    const ageInDays = Math.max(
        0,
        (Date.now() - adoptedAt) / (1000 * 60 * 60 * 24)
    );

    if (ageInDays >= 7) {
        return {
            stage: "Adult",
            progress: 100,
            nextStage: null,
        };
    }

    if (ageInDays >= 3) {
        return {
            stage: "Teen",
            progress: ((ageInDays - 3) / 4) * 100,
            nextStage: "Adult",
        };
    }

    return {
        stage: "Baby",
        progress: (ageInDays / 3) * 100,
        nextStage: "Teen",
    };
}


// ---------------------------------------------------------------------------
// Stat effect helpers (used by shop items)
// ---------------------------------------------------------------------------

export type PetStats = Record<StatKey, number>;

const STAT_KEYS: StatKey[] = ["hunger", "happiness", "energy"];

export const clampStat = (value: number) => Math.max(0, Math.min(100, value));

export function applyStatEffects(stats: PetStats, effects: StatEffects): PetStats {
    return {
        hunger: clampStat(stats.hunger + (effects.hunger ?? 0)),
        happiness: clampStat(stats.happiness + (effects.happiness ?? 0)),
        energy: clampStat(stats.energy + (effects.energy ?? 0)),
    };
}

/** The change that actually landed after capping, rounded for display. */
export function getAppliedEffects(before: PetStats, after: PetStats): StatEffects {
    const applied: StatEffects = {};

    for (const stat of STAT_KEYS) {
        const delta = Math.round(after[stat] - before[stat]);
        if (delta !== 0) applied[stat] = delta;
    }

    return applied;
}
