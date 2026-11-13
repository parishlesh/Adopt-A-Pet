
"use client";

import {
    Heart,
    Utensils,
    Gamepad2,
    Moon,
    Sparkles,
    Coins,
    ShoppingBag,
} from "lucide-react";
import {
    usePetStore,
    DAILY_REWARDS,
} from "@/store/petStore";
import { useEffect, useState } from "react";
import { calculatePetStats, getPetMood, isSleepComplete } from "@/lib/petEngine";
import PixelPet from "@/components/PixelPet";
import GrowthProgress from "@/components/GrowthProgress";
import PetNotifications from "@/components/PetNotifications";
import CatchTheTreats, {
    type GameRewards,
} from "./mini-game/CatchTheTreats";
import PetShop from "@/components/shop/PetShop";

export default function PetDashboard() {
    const pet = usePetStore((state) => state.adoptedPet);
    const updateStats = usePetStore((state) => state.updateStats);
    const [activeAction, setActiveAction] = useState<
        "feed" | "play" | "sleep" | null
    >(null);

    const startSleep = usePetStore((state) => state.startSleep);
    const wakePet = usePetStore((state) => state.wakePet);

    const [isGameOpen, setIsGameOpen] = useState(false);
    const [isShopOpen, setIsShopOpen] = useState(false);
    const isModalOpen = isGameOpen || isShopOpen;

    const coins = usePetStore((state) => state.coins);
    const dailyStreak = usePetStore((state) => state.dailyStreak);
    const lastDailyClaimDate = usePetStore(
        (state) => state.lastDailyClaimDate
    );
    const claimDailyReward = usePetStore(
        (state) => state.claimDailyReward
    );


    useEffect(() => {

        const updatePet = () => {
            const currentPet = usePetStore.getState().adoptedPet;

            if (!currentPet) return;

            const newStats = calculatePetStats(currentPet);

            if (newStats) {
                usePetStore.getState().updateStats(newStats);
            }

            if (isSleepComplete(currentPet)) {
                usePetStore.getState().wakePet();
            }
        };


        // Calculate immediately when dashboard opens.
        updatePet();

        // Continue updating while the dashboard is open.
        const interval = setInterval(updatePet, 30000);

        // Update when the user returns to the browser.
        document.addEventListener("visibilitychange", updatePet);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", updatePet);
        };
    }, []);

    useEffect(() => {
        if (!activeAction) return;

        const timer = setTimeout(() => {
            setActiveAction(null);
        }, 1500);

        return () => clearTimeout(timer);
    }, [activeAction]);

    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const today = getLocalDateString(new Date());

    const hasClaimedToday = lastDailyClaimDate === today;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const nextStreak = hasClaimedToday
        ? dailyStreak
        : lastDailyClaimDate === getLocalDateString(yesterday)
            ? dailyStreak + 1
            : 1;

    const todayReward =
        DAILY_REWARDS[(nextStreak - 1) % DAILY_REWARDS.length];

    if (!pet) return null;

    const stats = [
        {
            label: "Fullness",
            value: pet.hunger,
            icon: Utensils,
        },
        {
            label: "Happiness",
            value: pet.happiness,
            icon: Heart,
        },
        {
            label: "Energy",
            value: pet.energy,
            icon: Moon,
        },
    ];




    const interact = (action: "feed" | "play" | "sleep") => {
        const currentPet = usePetStore.getState().adoptedPet;

        if (!currentPet || currentPet.isSleeping || activeAction || isModalOpen) return;

        if (action === "feed") {
            if (currentPet.hunger >= 100) return;

            updateStats({
                hunger: Math.min(100, currentPet.hunger + 20),
                happiness: Math.min(100, currentPet.happiness + 5),
            });
        }

        if (action === "play") {
            if (currentPet.energy < 15) return;

            updateStats({
                happiness: Math.min(100, currentPet.happiness + 20),
                energy: Math.max(0, currentPet.energy - 15),
                hunger: Math.max(0, currentPet.hunger - 10),
            });
        }

        if (action === "sleep") {
            if (currentPet.energy >= 100) return;
            startSleep();
        }

        setActiveAction(action);
    };



    const mood = getPetMood(pet);

    return (
        <main className="min-h-screen bg-[#FFF9F0] p-6 md:p-12">
            <div className="max-w-4xl mx-auto">

                <header className="flex justify-between items-center mb-10">
                    <div>
                        <p className="text-sm text-[#A58E7D]">
                            YOUR LITTLE WORLD
                        </p>

                        <h1 className="text-3xl font-black text-[#493B32]">
                            Hello, {pet.customName}!
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-[#FFF0D9] rounded-full px-4 py-2 text-sm font-bold text-[#94621D]">
                            <Coins size={16} className="inline mr-2" />
                            {coins}
                        </div>

                        <div className="bg-white rounded-full px-4 py-2 text-sm text-[#A58E7D]">
                            <Sparkles size={15} className="inline mr-2" />
                            {mood}
                        </div>
                    </div>
                </header>

                <section className="bg-[#F7EFE4] rounded-4xl p-10 text-center">
                    <PixelPet
                        pet={pet}
                        activeAction={activeAction}
                    />

                    <PetNotifications pet={pet} />

                    {/* <h2 className="text-2xl font-bold text-[#493B32]">
                        {pet.customName}
                    </h2>

                    <p className="text-[#927F72] mt-2">
                        Your little {pet.species.toLowerCase()} is waiting for you!
                    </p> */}

                    {pet.isSleeping && pet.sleepUntil && (
                        <div className="mt-4 text-center bg-indigo-50 rounded-2xl p-4">
                            <p className="font-semibold text-indigo-800">
                                🌙 {pet.customName} is sleeping
                            </p>

                            <p className="text-sm text-indigo-500 mt-1">
                                Energy is being restored. Let your friend rest!
                            </p>
                        </div>
                    )}
                </section>


                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                    {stats.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-white rounded-2xl p-5 shadow-sm">
                            <div className="flex justify-between mb-3">
                                <span className="font-semibold text-[#493B32]">
                                    {label}
                                </span>
                                <Icon size={19} className="text-[#E9A66B]" />
                            </div>

                            <div className="h-3 bg-[#F0E3D4] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#E9A66B] rounded-full transition-all"
                                    style={{ width: `${value}%` }}
                                />
                            </div>

                            <p className="text-right text-xs mt-2 text-[#927F72]">
                                {Math.round(value)}/100
                            </p>
                        </div>
                    ))}
                </section>

                <GrowthProgress adoptedAt={pet.adoptedAt} />
                {/* <GrowthProgress  adoptedAt={Date.now() - 2 * 24 * 60 * 60 * 1000} /> */}


                <section className="mt-8 bg-white rounded-3xl p-6">


                    <div className="grid grid-cols-3 gap-3">
                        <button
                            disabled={!!activeAction || pet.isSleeping || isModalOpen}
                            onClick={() => interact("feed")}
                            className="bg-[#FFF0D9] p-4 rounded-2xl text-[#493B32] disabled:opacity-50"
                        >
                            <Utensils className="mx-auto mb-2" />
                            Feed
                        </button>

                        <button onClick={() => interact("play")}
                            disabled={!!activeAction || pet.isSleeping || isModalOpen}
                            className="bg-[#FCE8ED] p-4 rounded-2xl text-[#493B32] disabled:opacity-50">
                            <Gamepad2 className="mx-auto mb-2" />
                            Play
                        </button>


                        {pet.isSleeping ? (
                            <button
                                onClick={wakePet}
                                className="bg-[#E8EDFC] p-4 rounded-2xl text-[#493B32] w-full"
                            >
                                <span className="block text-2xl mb-2">☀️</span>
                                Wake Up
                            </button>
                        ) : (
                            <button
                                disabled={!!activeAction || pet.isSleeping || isModalOpen}
                                onClick={() => interact("sleep")}
                                className="bg-[#E8EDFC] p-4 rounded-2xl text-[#493B32] disabled:opacity-50"
                            >
                                <Moon className="mx-auto mb-2" />
                                Sleep
                            </button>
                        )}

                        <button
                            onClick={() => setIsGameOpen(true)}
                            disabled={pet.isSleeping || !!activeAction || isShopOpen || pet.energy < 10}
                            className="col-span-3 sm:col-span-2 bg-[#F0E9FC] p-4 rounded-2xl text-[#493B32] disabled:opacity-50"
                        >
                            <span className="block text-2xl mb-2">🍓</span>
                            Catch the Treats
                            <span className="block text-xs mt-1 text-[#927F72]">
                                Play a mini-game with your pet!
                            </span>
                        </button>

                        <button
                            onClick={() => setIsShopOpen(true)}
                            disabled={!!activeAction || isGameOpen}
                            className="col-span-3 sm:col-span-1 bg-[#FFF0D9] p-4 rounded-2xl text-[#493B32] disabled:opacity-50"
                        >
                            <ShoppingBag className="mx-auto mb-2" />
                            Pet Shop
                            <span className="block text-xs mt-1 text-[#927F72]">
                                Spend your coins
                            </span>
                        </button>
                    </div>
                </section>


                {!hasClaimedToday && (
                    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-3xl p-6 text-center shadow-2xl">

                            <div className="text-5xl mb-3">🎁</div>

                            <h2 className="text-2xl font-black text-[#493B32]">
                                Daily Rewards!
                            </h2>

                            <p className="text-sm text-[#A58E7D] mt-2">
                                Come back every day and collect your rewards!
                            </p>

                            {/* Streak */}
                            <div className="bg-[#FFF8ED] rounded-2xl p-3 mt-5">
                                <p className="text-xs font-semibold text-[#A58E7D]">
                                    YOUR CURRENT STREAK
                                </p>
                                <p className="text-2xl font-black text-[#B08C70] mt-1">
                                    🔥 {nextStreak} {nextStreak === 1 ? "Day" : "Days"}
                                </p>
                            </div>

                            {/* Seven-day calendar */}
                            <div className="grid grid-cols-4 gap-2 mt-5">
                                {DAILY_REWARDS.map((reward, index) => {
                                    const dayNumber = index + 1;
                                    const completed = dayNumber < ((nextStreak - 1) % 7) + 1;
                                    const current =
                                        dayNumber === ((nextStreak - 1) % 7) + 1;

                                    return (
                                        <div
                                            key={reward.day}
                                            className={`rounded-xl p-3 border-2 transition-all ${completed
                                                    ? "bg-green-50 border-green-200"
                                                    : current
                                                        ? "bg-[#FFF0D9] border-[#E9A66B] scale-105"
                                                        : "bg-gray-50 border-gray-100 opacity-60"
                                                }`}
                                        >
                                            <p className="text-xs font-bold text-[#927F72]">
                                                Day {dayNumber}
                                            </p>

                                            <div className="text-2xl my-2">
                                                {completed
                                                    ? "✅"
                                                    : reward.coins > 0
                                                        ? "🪙"
                                                        : "❤️"}
                                            </div>

                                            <p className="text-xs font-bold text-[#493B32]">
                                                {reward.coins > 0
                                                    ? `${reward.coins} Coins`
                                                    : `+${reward.happiness} HP`}
                                            </p>

                                            {current && (
                                                <p className="text-[10px] font-bold text-[#B08C70] mt-1">
                                                    TODAY
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Today's reward */}
                            <div className="mt-5 bg-[#FFF8ED] rounded-2xl p-4">
                                <p className="text-sm text-[#927F72]">
                                    Today&apos;s reward
                                </p>

                                <p className="text-xl font-black text-[#493B32] mt-1">
                                    {todayReward.coins > 0
                                        ? `🪙 ${todayReward.coins} Coins`
                                        : `❤️ +${todayReward.happiness} Happiness`}
                                </p>
                            </div>

                            <button
                                onClick={claimDailyReward}
                                className="w-full mt-5 bg-[#B08C70] hover:bg-[#98745A] text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                Claim Reward 🎉
                            </button>

                            <p className="text-xs text-[#A58E7D] mt-3">
                                Don&apos;t miss a day, or your streak will reset!
                            </p>
                        </div>
                    </div>
                )}


                {isShopOpen && (
                    <PetShop onClose={() => setIsShopOpen(false)} />
                )}

                {isGameOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-md">
                            <CatchTheTreats
                                onGameComplete={(score, rewards: GameRewards) => {
                                    const currentPet = usePetStore.getState().adoptedPet;

                                    if (!currentPet) return;

                                    updateStats({
                                        happiness: Math.min(
                                            100,
                                            currentPet.happiness + rewards.happiness
                                        ),
                                        energy: Math.max(
                                            0,
                                            currentPet.energy + rewards.energy
                                        ),
                                        hunger: Math.max(
                                            0,
                                            currentPet.hunger + rewards.hunger
                                        ),
                                    });
                                }}
                                onClose={() => setIsGameOpen(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
