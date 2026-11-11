
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Treat {
    id: number;
    x: number;
    y: number;
    emoji: string;
}

interface CatchTheTreatsProps {
    onGameComplete: (score: number) => void;
    onClose: () => void;
}

const GAME_DURATION = 10;
const GAME_WIDTH = 320;
const BASKET_WIDTH = 64;
const TREAT_SIZE = 28;

const TREATS = ["🍓", "🍎", "🍪", "🫐", "🍒"];

export default function CatchTheTreats({
    onGameComplete,
    onClose,
}: CatchTheTreatsProps) {
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [score, setScore] = useState(0);
    const [basketX, setBasketX] = useState(128);
    const [treats, setTreats] = useState<Treat[]>([]);
    const [gameOver, setGameOver] = useState(false);

    const basketRef = useRef(128);
    const scoreRef = useRef(0);
    const treatIdRef = useRef(0);
    const gameOverRef = useRef(false);
    const spawnTimerRef = useRef(0);
    const lastFrameRef = useRef(0);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const caughtTreatsRef = useRef(new Set<number>());

    const moveBasket = useCallback((direction: number) => {
        const nextX = Math.max(
            0,
            Math.min(
                GAME_WIDTH - BASKET_WIDTH,
                basketRef.current + direction * 24
            )
        );

        basketRef.current = nextX;
        setBasketX(nextX);
    }, []);

    const finishGame = useCallback(() => {
        if (gameOverRef.current) return;

        gameOverRef.current = true;
        setGameOver(true);
        setStarted(false);
        onGameComplete(scoreRef.current);
    }, [onGameComplete]);

    useEffect(() => {
        if (!started || gameOver) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
                event.preventDefault();
                moveBasket(-1);
            }

            if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
                event.preventDefault();
                moveBasket(1);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [started, gameOver, moveBasket]);

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
    }, [started, gameOver, finishGame]);

    useEffect(() => {
        if (started && timeLeft === 0 && !gameOver) {
            finishGame();
        }
    }, [started, timeLeft, gameOver, finishGame]);

    const startGame = () => {
        basketRef.current = 128;
        scoreRef.current = 0;
        treatIdRef.current = 0;
        spawnTimerRef.current = 0;
        lastFrameRef.current = 0;
        gameOverRef.current = false;
        caughtTreatsRef.current.clear();

        setBasketX(128);
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setTreats([]);
        setGameOver(false);
        setStarted(true);
    };

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        const bounds = gameAreaRef.current?.getBoundingClientRect();
        if (!bounds) return;

        const touchX = event.touches[0].clientX - bounds.left;
        const nextX = Math.max(
            0,
            Math.min(
                GAME_WIDTH - BASKET_WIDTH,
                touchX - BASKET_WIDTH / 2
            )
        );

        basketRef.current = nextX;
        setBasketX(nextX);
    };

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
                ref={gameAreaRef}
                onTouchMove={handleTouchMove}
                onTouchStart={handleTouchMove}
                className="relative mx-auto overflow-hidden rounded-2xl border-2 border-[#F2DFCB] bg-[#FFF8ED] touch-none"
                style={{ width: GAME_WIDTH, height: 320 }}
            >
                <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(#D8B99B 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                    }}
                />

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

                <motion.div
                    className="absolute bottom-4 text-4xl"
                    animate={{ x: basketX }}
                    transition={{ duration: 0.05 }}
                    style={{ left: 0, width: BASKET_WIDTH }}
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
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center">
                        <span className="text-5xl mb-3">🏆</span>
                        <h3 className="text-2xl font-bold text-[#493B32]">
                            Time&apos;s up!
                        </h3>
                        <p className="text-[#B08C70] mb-4">
                            You caught {score} treats!
                        </p>
                        <p className="text-sm text-[#493B32] mb-4">
                            Your pet will love these treats! ❤️
                        </p>
                        <button
                            onClick={startGame}
                            className="bg-[#B08C70] text-white px-6 py-3 rounded-xl font-bold"
                        >
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            {started && (
                <div className="flex justify-center gap-8 mt-4">
                    <button
                        onClick={() => moveBasket(-1)}
                        className="bg-[#FFF0D9] px-8 py-3 rounded-xl text-2xl"
                    >
                        ←
                    </button>

                    <button
                        onClick={() => moveBasket(1)}
                        className="bg-[#FFF0D9] px-8 py-3 rounded-xl text-2xl"
                    >
                        →
                    </button>
                </div>
            )}

            <p className="text-center text-xs text-[#B08C70] mt-4">
                Use ← → keys, A/D, or drag on mobile to move your basket.
            </p>
        </div>
    );
}
