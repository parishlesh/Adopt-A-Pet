/**
 * Catch the Treats reward rules, shared by the game's summary screen and the
 * dashboard that applies them.
 */

export interface GameRewards {
    happiness: number;
    energy: number;
    hunger: number;
}

/** Highest threshold first: score >= minScore earns that happiness. */
const HAPPINESS_TIERS = [
    { minScore: 20, happiness: 20 },
    { minScore: 10, happiness: 15 },
    { minScore: 5, happiness: 10 },
    { minScore: 0, happiness: 5 },
] as const;

/** Every completed game costs the same energy and fullness. */
const GAME_ENERGY_COST = -10;
const GAME_HUNGER_COST = -5;

export function getGameRewards(score: number): GameRewards {
    const tier =
        HAPPINESS_TIERS.find(({ minScore }) => score >= minScore) ??
        HAPPINESS_TIERS[HAPPINESS_TIERS.length - 1];

    return {
        happiness: tier.happiness,
        energy: GAME_ENERGY_COST,
        hunger: GAME_HUNGER_COST,
    };
}
