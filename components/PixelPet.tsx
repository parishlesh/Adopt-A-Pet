
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { AdoptedPet } from "@/store/petStore";
import Image from "next/image";
import PetMoodEffect from "@/components/PetMoodEffect";
import { getPetMood, getPetGrowth } from "@/lib/petEngine";


interface PixelPetProps {
    pet: AdoptedPet;
    activeAction: "feed" | "play" | "sleep" | null;
}

const moodConfig = {
    Happy: {
        expression: "😊",
        message: "I'm having a wonderful day!",
        animation: {
            y: [0, -18, 0],
            rotate: [0, 5, -5, 0],
        },
        duration: 1.8,
    },
    Okay: {
        expression: "🙂",
        message: "Life is good!",
        animation: {
            y: [0, -7, 0],
        },
        duration: 2.5,
    },
    Hungry: {
        expression: "🥺",
        message: "Can I have something to eat?",
        animation: {
            rotate: [0, -7, 7, -5, 5, 0],
        },
        duration: 2,
    },
    Sleepy: {
        expression: "😴",
        message: "I need a little nap...",
        animation: {
            y: [0, 4, 0],
            rotate: [0, -3, 0],
        },
        duration: 3,
    },
    Sad: {
        expression: "😢",
        message: "I miss spending time with you.",
        animation: {
            y: [0, 5, 0],
            rotate: [0, -4, 0],
        },
        duration: 2.5,
    },
    Exhausted: {
        expression: "😵",
        message: "I really need some care...",
        animation: {
            rotate: [0, -3, 3, 0],
        },
        duration: 3,
    },
};

export default function PixelPet({
    pet,
    activeAction,
}: PixelPetProps) {
    const mood = getPetMood(pet);

 const moodFile = pet.isSleeping
    ? "sleepy"
    : mood === "Sleepy" || mood === "Exhausted"
        ? "sad"
        : mood.toLowerCase();

    const growth = getPetGrowth(pet.adoptedAt);

    const spritePath = `/pets/${pet.id}/${growth.stage.toLowerCase()}/${moodFile}.png`;

    const config = moodConfig[mood as keyof typeof moodConfig];
    return (
        <div className="relative flex flex-col items-center justify-center py-8">

            {/* Mood bubble */}
            <motion.div
                key={mood}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={
    pet.isSleeping
        ? { y: [0, 4, 0], scale: [1, 0.97, 1] }
        : config.animation
}
transition={{
    duration: pet.isSleeping ? 3 : config.duration,
    repeat: Infinity,
    ease: "easeInOut",
}}
                className="relative bg-white px-5 py-3 rounded-2xl shadow-sm mb-8"
            >
                <span className="text-sm font-medium text-[#493B32]">
                    {pet.isSleeping
    ? `${pet.customName} is sleeping... Shhh! 🌙`
    : config.message}
                </span>

                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 rotate-45 w-4 h-4 bg-white" />
            </motion.div>

            {/* Pet character */}
            <motion.div
                key={`${pet.id}-${mood}`}
                animate={config.animation}
                transition={{
                    duration: config.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="relative flex items-center justify-center"
            >
                {/* <div
          className="w-40 h-40 md:w-52 md:h-52 rounded-[40px] flex items-center justify-center text-8xl md:text-9xl shadow-inner"
          style={{
            backgroundColor: pet.color + "55",
          }}
        >
          {pet.emoji}
        </div> */}


                <div className="relative w-52 h-52">

                    <AnimatePresence mode="wait">
                        {activeAction && (
                            <motion.div
                                key={activeAction}
                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: -55 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.4 }}
                                className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 text-4xl"
                            >
                                {activeAction === "feed" && "🍗"}
                                {activeAction === "play" && "💖"}
                                {activeAction === "sleep" && "💤"}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        animate={
                            activeAction === "feed"
                                ? { scale: [1, 1.1, 0.95, 1] }
                                : activeAction === "play"
                                    ? { y: [0, -35, 0, -20, 0], rotate: [0, -8, 8, 0] }
                                    : activeAction === "sleep"
                                        ? { scale: [1, 0.95, 1], y: [0, 5, 0] }
                                        : { y: [0, -7, 0] }
                        }
                        transition={{
                            duration: activeAction ? 1.2 : 2.5,
                            repeat: activeAction ? 0 : Infinity,
                            ease: "easeInOut",
                        }}
                        className="relative w-full h-full"
                    >
                        <Image
                            src={spritePath}
                            alt={`${pet.customName} the ${pet.species}`}
                            fill
                            className="object-contain"
                            style={{ imageRendering: "pixelated" }}
                            priority
                        />
                    </motion.div>

                </div>


                <PetMoodEffect mood={mood} />

                {/* Expression */}
                {/* <motion.div
                    key={mood}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-4 -right-4 bg-white w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-md"
                >
                    {config.expression}
                </motion.div> */}
            </motion.div>

            <p className="mt-6 text-sm font-bold tracking-widest uppercase text-[#B08C70]">
                {mood}
            </p>

        </div>
    );
}
