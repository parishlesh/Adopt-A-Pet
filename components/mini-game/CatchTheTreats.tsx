"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getGameRewards, type GameRewards } from "@/lib/miniGameRewards";
import { TEST_MODE } from "@/lib/petEngine";

// Re-exported so existing imports from this file keep working.
export type { GameRewards };

interface CatchEffect {
    id: number;
    x: number;
    y: number;
}

interface Treat {
    id: number;
    x: number;
    y: number;
    emoji: string;
}

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
    const [treats, setTreats] = useState<Treat[]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [catchEffects, setCatchEffects] = useState<CatchEffect[]>([]);
    const [basketBounce, setBasketBounce] = useState(false);

    const basketRef = useRef(BASKET_START_X);
    const scoreRef = useRef(0);
    const treatIdRef = useRef(0);
    const gameOverRef = useRef(false);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const caughtTreatsRef = useRef(new Set<number>());
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

    const finishGame = useCallback(() => {
        if (gameOverRef.current) return;

        gameOverRef.current = true;
        heldDirectionsRef.current.clear();
        isDraggingRef.current = false;

        const score = scoreRef.current;
        const rewards = getGameRewards(score);

        setGameOver(true);
        setStarted(false);

        onGameComplete(score, rewards);
    }, [onGameComplete]);

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
        let spawnTimer = 0;
        let secondTimer = 0;

        const loop = (timestamp: number) => {
            if (!lastTime) lastTime = timestamp;

            const delta = Math.min(timestamp - lastTime, 50);
            lastTime = timestamp;

            spawnTimer += delta;
            secondTimer += delta;

            // Continuous keyboard / button movement (drag takes priority)
            const held = heldDirectionsRef.current;
            const direction =
                (held.has("right") ? 1 : 0) - (held.has("left") ? 1 : 0);

            if (direction !== 0 && !isDraggingRef.current) {
                setBasketPosition(
                    basketRef.current + direction * BASKET_SPEED * delta
                );
            }

            // Spawn a new treat every 850ms
            if (spawnTimer >= 850) {
                spawnTimer = 0;

                const newTreat: Treat = {
                    id: ++treatIdRef.current,
                    x: Math.random() * (GAME_WIDTH - TREAT_SIZE),
                    y: 0,
                    emoji: TREATS[
                        Math.floor(Math.random() * TREATS.length)
                    ],
                };

                setTreats((previous) => [...previous, newTreat]);
            }

            // Move treats and detect catches
            setTreats((previous) => {
                const basketLeft = basketRef.current;
                const basketRight = basketLeft + BASKET_WIDTH;

                let caughtCount = 0;

                const updated = previous
                    .map((treat) => ({
                        ...treat,
                        y: treat.y + delta * 0.12,
                    }))
                    .filter((treat) => {
                        const caught =
                            treat.y + TREAT_SIZE >= 270 &&
                            treat.y <= 300 &&
                            treat.x + TREAT_SIZE >= basketLeft &&
                            treat.x <= basketRight;

                        if (caught && !caughtTreatsRef.current.has(treat.id)) {
                            caughtTreatsRef.current.add(treat.id);
                            caughtCount++;

                            const effectId = ++catchEffectIdRef.current;

                            setCatchEffects((previous) => [
                                ...previous,
                                {
                                    id: effectId,
                                    x: treat.x,
                                    y: 260,
                                },
                            ]);

                            setBasketBounce(true);

                            setTimeout(() => {
                                setBasketBounce(false);
                            }, 180);

                            setTimeout(() => {
                                setCatchEffects((previous) =>
                                    previous.filter((effect) => effect.id !== effectId)
                                );
                            }, 750);
                        }

                        return !caught && treat.y < 320;
                    });

                if (caughtCount > 0) {
                    scoreRef.current += caughtCount;
                    setScore(scoreRef.current);
                }

                return updated;
            });

            // Update timer
            if (secondTimer >= 1000) {
                secondTimer -= 1000;

                setTimeLeft((previous) => Math.max(0, previous - 1));
            }

            if (!gameOverRef.current) {
                animationFrame = requestAnimationFrame(loop);
            }
        };

        animationFrame = requestAnimationFrame(loop);

        return () => cancelAnimationFrame(animationFrame);
    }, [started, gameOver, setBasketPosition]);

    useEffect(() => {
        if (started && timeLeft === 0 && !gameOver) {
            finishGame();
        }
    }, [started, timeLeft, gameOver, finishGame]);

    const startGame = () => {
        basketRef.current = BASKET_START_X;
        scoreRef.current = 0;
        treatIdRef.current = 0;
        gameOverRef.current = false;
        caughtTreatsRef.current.clear();
        heldDirectionsRef.current.clear();
        isDraggingRef.current = false;

        setBasketX(BASKET_START_X);
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setTreats([]);
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

            <div className="flex justify-between mb-3 text-[#493B32] font-bold">
                <span>⭐ Score: {score}</span>
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
                {treats.map((treat) => (
                    <div
                        key={treat.id}
                        className="absolute text-2xl"
                        style={{
                            left: treat.x,
                            top: treat.y,
                            width: TREAT_SIZE,
                            height: TREAT_SIZE,
                        }}
                    >
                        {treat.emoji}
                    </div>
                ))}
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
                            className="absolute z-20 pointer-events-none font-black text-lg text-green-600"
                            style={{
                                left: effect.x,
                                top: effect.y,
                            }}
                        >
                            +1 ✨
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
                        <span className="text-5xl mb-2">🏆</span>

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
