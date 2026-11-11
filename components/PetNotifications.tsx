
"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { AdoptedPet } from "@/store/petStore";

interface PetNotificationsProps {
    pet: AdoptedPet;
}

export default function PetNotifications({ pet }: PetNotificationsProps) {
    let notification = {
        emoji: "✨",
        message: "I'm having the best day!",
        color: "bg-[#FFF4D6]",
    };

    if (pet.isSleeping) {
        notification = {
            emoji: "🌙",
            message: "I'm sleeping. Let me rest!",
            color: "bg-[#E8EDFC]",
        };
    } else if (pet.hunger <= 20) {
        notification = {
            emoji: "🍗",
            message: "I'm really hungry! Feed me, please!",
            color: "bg-[#FFF0D9]",
        };
    } else if (pet.energy <= 20) {
        notification = {
            emoji: "😴",
            message: "I'm exhausted. I need some rest!",
            color: "bg-[#E8EDFC]",
        };
    } else if (pet.happiness <= 20) {
        notification = {
            emoji: "💔",
            message: "I'm feeling lonely. Play with me!",
            color: "bg-[#FCE8ED]",
        };
    } else if (pet.hunger <= 35) {
        notification = {
            emoji: "🍎",
            message: "I'm getting a little hungry!",
            color: "bg-[#FFF0D9]",
        };
    } else if (pet.energy <= 35) {
        notification = {
            emoji: "💤",
            message: "I'm getting sleepy...",
            color: "bg-[#E8EDFC]",
        };
    } else if (pet.happiness <= 35) {
        notification = {
            emoji: "🥺",
            message: "I miss spending time with you!",
            color: "bg-[#FCE8ED]",
        };
    } else if (
        pet.hunger >= 80 &&
        pet.happiness >= 80 &&
        pet.energy >= 80
    ) {
        notification = {
            emoji: "🥰",
            message: "I'm feeling amazing today!",
            color: "bg-[#F0F7E8]",
        };
    }

    return (
        <div className="w-full max-w-md mx-auto px-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={notification.message}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className={`${notification.color} rounded-2xl p-4 flex items-center gap-3`}
                >
                    <span className="text-3xl">
                        {notification.emoji}
                    </span>

                    <p className="text-sm font-semibold text-[#493B32]">
                        {notification.message}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
