
"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  mood: string;
}

const effects: Record<string, { emoji: string; message: string }> = {
  Happy: { emoji: "💖", message: "I'm so happy!" },
  Okay: { emoji: "✨", message: "Everything is okay!" },
  Hungry: { emoji: "🍗", message: "I'm hungry!" },
  Sleepy: { emoji: "💤", message: "Time for a nap!" },
  Sad: { emoji: "💧", message: "I'm feeling sad..." },
  Exhausted: { emoji: "😵", message: "I need some care!" },
};

export default function PetMoodEffect({ mood }: Props) {
  const effect = effects[mood] ?? effects.Okay;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mood}
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col items-center gap-2"
      >
        <motion.span
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl"
        >
          {effect.emoji}
        </motion.span>

        <span className="text-sm text-[#927F72] font-medium">
          {effect.message}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
