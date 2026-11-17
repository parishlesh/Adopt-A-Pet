"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    COIN_DROP_CHANCE,
    COIN_REWARD,
    MAX_ACTIVE_COINS,
    getGameRewards,
    type GameRewards,
} from "@/lib/miniGameRewards";
import { TEST_MODE } from "@/lib/petEngine";
import { COIN_ART } from "@/lib/gameArt";
import { usePetStore } from "@/store/petStore";
import PixelArt from "@/components/PixelArt";

// Re-exported so existing imports from this file keep working.
export type { GameRewards };

interface CatchEffect {
    id: number;
    kind: FallingObject["kind"];
    x: number;
    y: number;
}

/** Anything that falls and can be caught. Treats score; coins pay the wallet. */
type FallingObject =
    | { id: number; kind: "treat"; x: number; y: number; emoji: string }
    | { id: number; kind: "coin"; x: number; y: number };

interface CatchTheTreatsProps {
    onGameComplete: (score: number, rewards: GameRewards) => void;
    onClose: () => void;
}

type Direction = "left" | "right";

const GAME_DURATION = TEST_MODE ? 10 : 30; // seconds
// Logical play-field size. Physics runs in these units; the field is scaled to fit narrow screens.
const GAME_WIDTH = 320;
const GAME_HEIGHT = 320;
const BASKET_WIDTH = 64;
const BASKET_START_X = (GAME_WIDTH - BASKET_WIDTH) / 2;
const BASKET_SPEED = 0.35; // px per ms for keyboard / button movement
const TREAT_SIZE = 28;
const SPAWN_INTERVAL_MS = 850;
const FALL_SPEED = 0.12; // px per ms
// An object is caught while it overlaps this band above the basket.
const CATCH_ZONE_TOP = 270;
const CATCH_ZONE_BOTTOM = 300;
// Coin rolls run on the same interval, offset by half so a coin never
// appears at the same moment as a treat.
const COIN_ROLL_OFFSET_MS = SPAWN_INTERVAL_MS / 2;
// Keep a new coin from overlapping the most recent treat.
const COIN_MIN_GAP_FROM_TREAT = 40;
// Time a coin needs to fall into the catch zone. No coin rolls in the final
// stretch of the game, so every coin that appears can still be caught.
const COIN_FALL_TIME_MS = (CATCH_ZONE_TOP - TREAT_SIZE) / FALL_SPEED;

/** Random x for a coin, kept away from the latest treat where possible. */
const pickCoinX = (avoidX: number | null) => {
    const maxX = GAME_WIDTH - TREAT_SIZE;
    let x = Math.random() * maxX;

    for (let attempt = 0; attempt < 5 && avoidX !== null; attempt++) {
        if (Math.abs(x - avoidX) >= COIN_MIN_GAP_FROM_TREAT) break;
        x = Math.random() * maxX;
    }

    return x;
};

const TREATS = ["🍓", "🍎", "🍪", "🫐", "🍒"];

const clampBasketX = (x: number) =>
    Math.max(0, Math.min(GAME_WIDTH - BASKET_WIDTH, x));

export default function CatchTheTreats({
    onGameComplete,
    onClose,
}: CatchTheTreatsProps) {
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [score, setScore] = useState(0);
    const [basketX, setBasketX] = useState(BASKET_START_X);
    const [objects, setObjects] = useState<FallingObject[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [catchEffects, setCatchEffects] = useState<CatchEffect[]>([]);
    const [basketBounce, setBasketBounce] = useState(false);
    const [coinsCollected, setCoinsCollected] = useState(0);

    const basketRef = useRef(BASKET_START_X);
    const scoreRef = useRef(0);
    const objectIdRef = useRef(0);
    const gameOverRef = useRef(false);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    // The loop owns the falling objects; `objects` state is only a render snapshot.
    const objectsRef = useRef<FallingObject[]>([]);
    const caughtIdsRef = useRef(new Set<number>());
    // Game clock lives in refs so a re-render can never reset a running game.
    const elapsedMsRef = useRef(0);
    const spawnTimerRef = useRef(0);
    const coinTimerRef = useRef(COIN_ROLL_OFFSET_MS);
    const lastTreatXRef = useRef<number | null>(null);
    const coinsCollectedRef = useRef(0);
    const timeoutsRef = useRef(new Set<ReturnType<typeof setTimeout>>());
    const onGameCompleteRef = useRef(onGameComplete);
    const heldDirectionsRef = useRef(new Set<Direction>());
    const isDraggingRef = useRef(false);
    const catchEffectIdRef = useRef(0);
    const fieldWrapperRef = useRef<HTMLDivElement>(null);
    const [fieldScale, setFieldScale] = useState(1);

    // Scale the fixed 320x320 field down on screens narrower than the field.
    useEffect(() => {
        const wrapper = fieldWrapperRef.current;
        if (!wrapper) return;

        const observer = new ResizeObserver(([entry]) => {
            setFieldScale(Math.min(1, entry.contentRect.width / GAME_WIDTH));
        });

        observer.observe(wrapper);
        return () => observer.disconnect();
    }, []);


    const setBasketPosition = useCallback((x: number) => {
        const nextX = clampBasketX(x);
        basketRef.current = nextX;
        setBasketX(nextX);
    }, []);

    const moveBasketTo = useCallback(
        (clientX: number) => {
            const bounds = gameAreaRef.current?.getBoundingClientRect();
            if (!bounds) return;

            const scale = GAME_WIDTH / bounds.width;
            const pointerX = (clientX - bounds.left) * scale;

            setBasketPosition(pointerX - BASKET_WIDTH / 2);
        },
        [setBasketPosition]
    );

    // The parent passes a new callback on every render; read the latest one
    // through a ref so finishGame (and the game loop) stay stable.
    useEffect(() => {
        onGameCompleteRef.current = onGameComplete;
    }, [onGameComplete]);

    // Clear pending effect timers if the game is closed mid-animation.
    useEffect(() => {
        const timeouts = timeoutsRef.current;
        return () => {
            timeouts.forEach(clearTimeout);
            timeouts.clear();
        };
    }, []);

    const schedule = useCallback((callback: () => void, ms: number) => {
        const timeout = setTimeout(() => {
            timeoutsRef.current.delete(timeout);
            callback();
        }, ms);
        timeoutsRef.current.add(timeout);
    }, []);

    const finishGame = useCallback(() => {
        if (gameOverRef.current) return;

        gameOverRef.current = true;
        heldDirectionsRef.current.clear();
        isDraggingRef.current = false;

        const score = scoreRef.current;
        const rewards = getGameRewards(score);

        setGameOver(true);
        setStarted(false);

        // Only a game that ran to the end counts; closing early never gets here.
        usePetStore.getState().recordChallengeEvent("game-complete");
        onGameCompleteRef.current(score, rewards);
    }, []);

    /** Called from the game loop, never from a state updater. */
    const handleCatches = useCallback(
        (caught: FallingObject[]) => {
            const treats = caught.filter((object) => object.kind === "treat");
            const coins = caught.filter((object) => object.kind === "coin");
            const effects: FallingObject[] = [...treats];

            if (treats.length > 0) {
                scoreRef.current += treats.length;
                setScore(scoreRef.current);
            }

            // Coins are paid the moment they're caught; the summary only reports them.
            for (const coin of coins) {
                if (usePetStore.getState().addCoins(COIN_REWARD)) {
                    coinsCollectedRef.current += COIN_REWARD;
                    effects.push(coin);
                    usePetStore.getState().recordChallengeEvent("coin-catch");
                }
            }

            if (coins.length > 0) setCoinsCollected(coinsCollectedRef.current);

            for (const object of effects) {
                const effectId = ++catchEffectIdRef.current;

                setCatchEffects((previous) => [
                    ...previous,
                    { id: effectId, kind: object.kind, x: object.x, y: 260 },
                ]);

                schedule(() => {
                    setCatchEffects((previous) =>
                        previous.filter((effect) => effect.id !== effectId)
                    );
                }, 750);
            }

            setBasketBounce(true);
            schedule(() => setBasketBounce(false), 180);
        },
        [schedule]
    );

    // Keyboard: track held keys; actual movement happens in the game loop
    useEffect(() => {
        if (!started || gameOver) return;

        const held = heldDirectionsRef.current;

        const keyToDirection = (key: string): Direction | null => {
            if (key === "ArrowLeft" || key.toLowerCase() === "a") return "left";
            if (key === "ArrowRight" || key.toLowerCase() === "d") return "right";
            return null;
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            const direction = keyToDirection(event.key);
            if (!direction) return;

            event.preventDefault();
            held.add(direction);
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            const direction = keyToDirection(event.key);
            if (direction) held.delete(direction);
        };

        const handleBlur = () => held.clear();

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
            held.clear();
        };
    }, [started, gameOver]);

    useEffect(() => {
        if (!started || gameOver) return;

        let animationFrame = 0;
        let lastTime = 0;

        const loop = (timestamp: number) => {
            if (gameOverRef.current) return;
            if (!lastTime) lastTime = timestamp;

            const delta = Math.min(timestamp - lastTime, 50);
            lastTime = timestamp;

            elapsedMsRef.current += delta;
            spawnTimerRef.current += delta;

            // Continuous keyboard / button movement (drag takes priority)
            const held = heldDirectionsRef.current;
            const direction =
                (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);

            if (direction !== 0 && !isDraggingRef.current) {
                setBasketPosition(
                    basketRef.current + direction * BASKET_SPEED * delta
                );
            }

            // Spawn a new treat every SPAWN_INTERVAL_MS
            if (spawnTimerRef.current >= SPAWN_INTERVAL_MS) {
                spawnTimerRef.current = 0;

                const x = Math.random() * (GAME_WIDTH - TREAT_SIZE);
                lastTreatXRef.current = x;

                objectsRef.current = [
                    ...objectsRef.current,
                    {
                        id: ++objectIdRef.current,
                        kind: "treat",
                        x,
                        y: 0,
                        emoji: TREATS[Math.floor(Math.random() * TREATS.length)],
                    },
                ];
            }

            // Independent coin roll, offset from treat spawns
            coinTimerRef.current += delta;

            if (coinTimerRef.current >= SPAWN_INTERVAL_MS) {
                coinTimerRef.current = 0;

                const activeCoins = objectsRef.current.filter(
                    (object) => object.kind === "coin"
                ).length;

                const timeLeftMs = GAME_DURATION * 1000 - elapsedMsRef.current;

                if (
                    activeCoins < MAX_ACTIVE_COINS &&
                    timeLeftMs > COIN_FALL_TIME_MS &&
                    Math.random() < COIN_DROP_CHANCE
                ) {
                    objectsRef.current = [
                        ...objectsRef.current,
                        {
                            id: ++objectIdRef.current,
                            kind: "coin",
                            x: pickCoinX(lastTreatXRef.current),
                            y: 0,
                        },
                    ];
                }
            }

            // Move objects and detect catches
            const basketLeft = basketRef.current;
            const basketRight = basketLeft + BASKET_WIDTH;
            const remaining: FallingObject[] = [];
            const caught: FallingObject[] = [];

            for (const object of objectsRef.current) {
                const moved = { ...object, y: object.y + delta * FALL_SPEED };

                const isCaught =
                    moved.y + TREAT_SIZE >= CATCH_ZONE_TOP &&
                    moved.y <= CATCH_ZONE_BOTTOM &&
                    moved.x + TREAT_SIZE >= basketLeft &&
                    moved.x <= basketRight;

                if (isCaught) {
                    // Each object can only ever be collected once.
                    if (!caughtIdsRef.current.has(moved.id)) {
                        caughtIdsRef.current.add(moved.id);
                        caught.push(moved);
                    }
                    continue;
                }

                // Missed objects fall out of the field and disappear.
                if (moved.y < GAME_HEIGHT) remaining.push(moved);
            }

            objectsRef.current = remaining;
            setObjects(remaining);

            if (caught.length > 0) handleCatches(caught);

            // Timer: update the display once per second; end exactly on time.
            const secondsLeft = Math.max(
                0,
                GAME_DURATION - Math.floor(elapsedMsRef.current / 1000)
            );
            setTimeLeft(secondsLeft);

            if (elapsedMsRef.current >= GAME_DURATION * 1000) {
                finishGame();
                return;
            }

            animationFrame = requestAnimationFrame(loop);
        };

        animationFrame = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animationFrame);
    }, [started, gameOver, setBasketPosition, handleCatches, finishGame]);

    const startGame = () => {
        basketRef.current = BASKET_START_X;
        scoreRef.current = 0;
        objectIdRef.current = 0;
        gameOverRef.current = false;
        objectsRef.current = [];
        caughtIdsRef.current.clear();
        elapsedMsRef.current = 0;
        spawnTimerRef.current = 0;
        coinTimerRef.current = COIN_ROLL_OFFSET_MS;
        lastTreatXRef.current = null;
        coinsCollectedRef.current = 0;
        heldDirectionsRef.current.clear();
        isDraggingRef.current = false;

        setBasketX(BASKET_START_X);
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setObjects([]);
        setCoinsCollected(0);
        setGameOver(false);
        setStarted(true);
        setCatchEffects([]);
        setBasketBounce(false);
    };

    // Mouse + touch + pen drag via Pointer Events
    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!started || gameOver) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;

        isDraggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        moveBasketTo(event.clientX);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isDraggingRef.current) return;
        moveBasketTo(event.clientX);
    };

    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        isDraggingRef.current = false;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    // On-screen buttons: press and hold to move
    const pressDirection = (
        event: React.PointerEvent<HTMLButtonElement>,
        direction: Direction
    ) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        heldDirectionsRef.current.add(direction);
    };

    const releaseDirection = (direction: Direction) => {
        heldDirectionsRef.current.delete(direction);
    };

    const summaryRewards = getGameRewards(score);

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-[#493B32]">
                        🍓 Catch the Treats
                    </h2>
                    <p className="text-xs text-[#B08C70]">
                        Catch as many treats as you can!
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="text-[#493B32] text-xl"
                    aria-label="Close game"
                >
                    ✕
                </button>
            </div>

            <div className="flex items-center justify-between gap-2 mb-3 text-[#493B32] font-bold">
                <span>⭐ Score: {score}</span>

                <motion.span
                    key={coinsCollected}
                    initial={coinsCollected ? { scale: 1.25 } : false}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0D9] px-2.5 py-0.5 text-sm text-[#94621D]"
                    aria-label={`Coins collected this game: ${coinsCollected}`}
                >
                    <PixelArt art={COIN_ART} className="w-4 h-4" />
                    {coinsCollected}
                </motion.span>

                <span>⏱️ {timeLeft}s</span>
            </div>

            <div
                ref={fieldWrapperRef}
                className="w-full mx-auto"
                style={{ maxWidth: GAME_WIDTH, height: GAME_HEIGHT * fieldScale }}
            >
            <div
                ref={gameAreaRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`relative overflow-hidden rounded-2xl border-2 border-[#F2DFCB] bg-[#FFF8ED] touch-none select-none ${started ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                style={{
                    width: GAME_WIDTH,
                    height: GAME_HEIGHT,
                    transform: `scale(${fieldScale})`,
                    transformOrigin: "top left",
                }}
            >
                {objects.map((object) =>
                    object.kind === "coin" ? (
                        <div
                            key={object.id}
                            data-kind="coin"
                            className="absolute drop-shadow-sm"
                            style={{
                                left: object.x,
                                top: object.y,
                                width: TREAT_SIZE,
                                height: TREAT_SIZE,
                            }}
                        >
                            <PixelArt art={COIN_ART} className="w-full h-full" />
                        </div>
                    ) : (
                        <div
                            key={object.id}
                            data-kind="treat"
                            className="absolute text-2xl"
                            style={{
                                left: object.x,
                                top: object.y,
                                width: TREAT_SIZE,
                                height: TREAT_SIZE,
                            }}
                        >
                            {object.emoji}
                        </div>
                    )
                )}
                <AnimatePresence>
                    {catchEffects.map((effect) => (
                        <motion.div
                            key={effect.id}
                            initial={{
                                opacity: 1,
                                y: 0,
                                scale: 0.6,
                            }}
                            animate={{
                                opacity: 0,
                                y: -55,
                                scale: 1.2,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7 }}
                            className={`absolute z-20 pointer-events-none font-black text-lg whitespace-nowrap ${
                                effect.kind === "coin" ? "text-[#C98A12]" : "text-green-600"
                            }`}
                            style={{
                                left: effect.x,
                                top: effect.y,
                            }}
                        >
                            {effect.kind === "coin" ? `+${COIN_REWARD} 🪙` : "+1 ✨"}
                        </motion.div>
                    ))}
                </AnimatePresence>

             <motion.div
    animate={{
        x: basketX,
        y: basketBounce ? [0, -10, 0] : 0,
        scale: basketBounce ? [1, 1.15, 1] : 1,
    }}
    transition={{
        x: { duration: 0 },
        y: { duration: 0.18 },
        scale: { duration: 0.18 },
    }}
    className="absolute bottom-4 left-0 text-4xl text-center will-change-transform pointer-events-none"
    style={{ width: BASKET_WIDTH }}
>
    🧺
</motion.div>

                {!started && !gameOver && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                        <span className="text-5xl mb-3">🍓</span>
                        <p className="font-bold text-[#493B32] mb-3">
                            Ready to play?
                        </p>
                        <button
                            onClick={startGame}
                            className="bg-[#B08C70] text-white px-6 py-3 rounded-xl font-bold"
                        >
                            Start Game
                        </button>
                    </div>
                )}

                {gameOver && (
                    <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-4 z-10">
                        <span className="text-4xl mb-1">🏆</span>

                        <h3 className="text-2xl font-black text-[#493B32]">
                            Amazing Work!
                        </h3>

                        <p className="text-[#B08C70] font-semibold mb-3">
                            You caught {score} treats!
                        </p>

                        <div className="w-full max-w-60 bg-[#FFF8ED] rounded-xl p-3 mb-4">
                            <p className="text-sm font-bold text-[#493B32] mb-2 text-center">
                                Your pet&apos;s rewards ❤️
                            </p>

                            <div className="flex justify-between text-sm mb-1">
                                <span>❤️ Happiness</span>
                                <span className="font-bold text-green-600">
                                    +{summaryRewards.happiness}
                                </span>
                            </div>

                            <div className="flex justify-between text-sm mb-1">
                                <span>⚡ Energy</span>
                                <span className="font-bold text-red-500">{summaryRewards.energy}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span>🍽️ Fullness</span>
                                <span className="font-bold text-red-500">{summaryRewards.hunger}</span>
                            </div>

                            {/* Informational only: these coins were credited as they were caught. */}
                            <div className="flex justify-between text-sm mt-1 pt-1 border-t border-[#F2DFCB]">
                                <span className="inline-flex items-center gap-1">
                                    <PixelArt art={COIN_ART} className="w-3.5 h-3.5" />
                                    Coins <span className="text-[10px] text-[#A58E7D]">(in wallet)</span>
                                </span>
                                <span className="font-bold text-[#C98A12]">+{coinsCollected}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 w-full max-w-65">
                            <button
                                onClick={startGame}
                                className="flex-1 bg-[#FFF0D9] text-[#493B32] py-2.5 rounded-xl font-bold text-sm"
                            >
                                Play Again
                            </button>

                            <button
                                onClick={onClose}
                                className="flex-1 bg-[#B08C70] text-white py-2.5 rounded-xl font-bold text-sm"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}
            </div>
            </div>

            {started && (
                <div className="flex justify-center gap-8 mt-4">
                    <button
                        onPointerDown={(event) => pressDirection(event, "left")}
                        onPointerUp={() => releaseDirection("left")}
                        onPointerCancel={() => releaseDirection("left")}
                        onLostPointerCapture={() => releaseDirection("left")}
                        onContextMenu={(event) => event.preventDefault()}
                        className="bg-[#FFF0D9] px-8 py-3 rounded-xl text-2xl touch-none select-none"
                        aria-label="Move basket left"
                    >
                        ←
                    </button>

                    <button
                        onPointerDown={(event) => pressDirection(event, "right")}
                        onPointerUp={() => releaseDirection("right")}
                        onPointerCancel={() => releaseDirection("right")}
                        onLostPointerCapture={() => releaseDirection("right")}
                        onContextMenu={(event) => event.preventDefault()}
                        className="bg-[#FFF0D9] px-8 py-3 rounded-xl text-2xl touch-none select-none"
                        aria-label="Move basket right"
                    >
                        →
                    </button>
                </div>
            )}

            <p className="text-center text-xs text-[#B08C70] mt-4">
                Drag inside the game area, or use ← → / A D to move your basket.
            </p>
        </div>
    );
}
