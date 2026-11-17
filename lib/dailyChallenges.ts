/**
 * Daily challenges: three small goals that reset at local midnight.
 * Kept separate from daily login rewards.
 */

export type ChallengeEvent = "feed" | "coin-catch" | "game-complete";

export type ChallengeId = "feed-pet" | "catch-coins" | "finish-game";

export interface DailyChallenge {
    id: ChallengeId;
    title: string;
    emoji: string;
    event: ChallengeEvent;
    goal: number;
    reward: number;
}

export const DAILY_CHALLENGES: readonly DailyChallenge[] = [
    {
        id: "feed-pet",
        title: "Feed your pet 2 times",
        emoji: "🍎",
        event: "feed",
        goal: 2,
        reward: 10,
    },
    {
        id: "catch-coins",
        title: "Catch 2 falling coins",
        emoji: "🧺",
        event: "coin-catch",
        goal: 2,
        reward: 15,
    },
    {
        id: "finish-game",
        title: "Complete a Catch the Treats game",
        emoji: "🍓",
        event: "game-complete",
        goal: 1,
        reward: 10,
    },
];

/** Progress for one local calendar day (`date` is "YYYY-MM-DD"). */
export interface DailyChallengeState {
    date: string | null;
    progress: Partial<Record<ChallengeId, number>>;
    claimed: ChallengeId[];
}

export const EMPTY_CHALLENGE_STATE: DailyChallengeState = {
    date: null,
    progress: {},
    claimed: [],
};

export type ClaimChallengeFailureReason =
    | "NOT_READY"
    | "INVALID_CHALLENGE"
    | "NOT_COMPLETE"
    | "ALREADY_CLAIMED";

export type ClaimChallengeResult =
    | { ok: true; challenge: DailyChallenge }
    | { ok: false; reason: ClaimChallengeFailureReason };

export const getChallenge = (id: string): DailyChallenge | undefined =>
    DAILY_CHALLENGES.find((challenge) => challenge.id === id);

/** Saved progress if it belongs to `today`, otherwise a fresh day. */
export const challengesForToday = (
    state: DailyChallengeState,
    today: string
): DailyChallengeState =>
    state.date === today
        ? state
        : { date: today, progress: {}, claimed: [] };
