
"use client";

import { motion } from "framer-motion";
import { getPetGrowth } from "@/lib/petEngine";

interface GrowthProgressProps {
  adoptedAt: number;
}

export default function GrowthProgress({ adoptedAt }: GrowthProgressProps) {
  const growth = getPetGrowth(adoptedAt);

  return (
    <div className="bg-white rounded-3xl p-6 mt-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <p className="text-xs tracking-widest text-[#A58E7D] uppercase">
            Your pet&apos;s journey
          </p>

          <h3 className="text-xl font-bold text-[#493B32] mt-1">
            {growth.stage} Stage
          </h3>
        </div>

        <span className="text-3xl">🌱</span>
      </div>

      <div className="flex justify-between text-sm text-[#927F72] mb-2">
        <span>{growth.stage}</span>
        <span>{growth.nextStage ?? "Fully grown"}</span>
      </div>

      <div className="h-3 bg-[#F0E3D4] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${growth.progress}%` }}
          className="h-full bg-[#A5C98A] rounded-full"
        />
      </div>

      <p className="text-xs text-[#A58E7D] mt-3">
        {growth.nextStage
          ? `${Math.round(growth.progress)}% progress to ${growth.nextStage}`
          : "Your little friend has fully grown!"}
      </p>
    </div>
  );
}
