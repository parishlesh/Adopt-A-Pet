"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { getLocalDateString, usePetStore } from "@/store/petStore";
import {
    DAILY_CHALLENGES,
    challengesForToday,
    type ChallengeId,
} from "@/lib/dailyChallenges";
import { COIN_ART } from "@/lib/gameArt";
import PixelArt from "@/components/PixelArt";

const CARD_TINT: Record<ChallengeId, string> = {
    "feed-pet": "bg-[#FFF0D9]",
    "catch-coins": "bg-[#F0E9FC]",
    "finish-game": "bg-[#FCE8ED]",
};

export default function DailyChallenges() {
    const savedChallenges = usePetStore((state) => state.dailyChallenges);
    const claimChallenge = usePetStore((state) => state.claimChallenge);
    const [lastClaimed, setLastClaimed] = useState<ChallengeId | null>(null);

    // Progress saved for an earlier day reads as a fresh day.
    const today = challengesForToday(
        savedChallenges,
        getLocalDateString(new Date())
    );
    const doneCount = today.claimed.length;

    const handleClaim = (id: ChallengeId) => {
        if (claimChallenge(id).ok) setLastClaimed(id);
    };

    return (
        <section className="mt-6 bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                    <p className="text-xs tracking-widest text-[#A58E7D] uppercase">
                        Daily challenges
                    </p>
                    <h3 className="text-xl font-bold text-[#493B32] mt-1">
                        Today&apos;s goals
                    </h3>
                </div>

                <p className="text-xs font-semibold text-[#927F72]">
                    {doneCount}/{DAILY_CHALLENGES.length} done · resets at midnight
                </p>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DAILY_CHALLENGES.map((challenge) => {
                    const progress = today.progress[challenge.id] ?? 0;
                    const isClaimed = today.claimed.includes(challenge.id);
                    const isComplete = progress >= challenge.goal;

                    return (
                        <li
                            key={challenge.id}
                            data-challenge={challenge.id}
                            className={`relative rounded-2xl p-4 flex flex-col gap-3 ${
                                isClaimed
                                    ? "bg-[#F0F7E8]"
                                    : CARD_TINT[challenge.id]
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl leading-none" aria-hidden>
                                    {challenge.emoji}
                                </span>
                                <p className="flex-1 text-sm font-bold text-[#493B32] leading-snug">
                                    {challenge.title}
                                </p>
                                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#94621D]">
                                    <PixelArt art={COIN_ART} className="w-3.5 h-3.5" />
                                    {challenge.reward}
                                </span>
                            </div>

                            <div>
                                <div className="h-2.5 bg-white/80 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            isComplete ? "bg-[#A5C98A]" : "bg-[#E9A66B]"
                                        }`}
                                        style={{
                                            width: `${(progress / challenge.goal) * 100}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-right text-xs mt-1 text-[#927F72]">
                                    {progress}/{challenge.goal}
                                </p>
                            </div>

                            {isClaimed ? (
                                <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#493B32] text-white text-sm font-bold py-2">
                                    <Check size={15} aria-hidden />
                                    Claimed
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleClaim(challenge.id)}
                                    disabled={!isComplete}
                                    className="rounded-xl text-sm font-bold py-2 transition-colors bg-[#B08C70] text-white hover:bg-[#98745A] disabled:bg-white/70 disabled:text-[#A58E7D] disabled:cursor-not-allowed"
                                >
                                    {isComplete ? `Claim ${challenge.reward} coins` : "In progress"}
                                </button>
                            )}

                            <AnimatePresence>
                                {lastClaimed === challenge.id && (
                                    <motion.span
                                        key={`claimed-${challenge.id}`}
                                        initial={{ opacity: 1, y: 0 }}
                                        animate={{ opacity: 0, y: -28 }}
                                        transition={{ duration: 0.9 }}
                                        onAnimationComplete={() => setLastClaimed(null)}
                                        className="pointer-events-none absolute right-4 top-3 text-sm font-black text-[#C98A12]"
                                    >
                                        +{challenge.reward} 🪙
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
