"use client";

import { motion } from "framer-motion";
import { ACCESSORY_ART } from "@/lib/accessoryArt";
import { getAccessoryOverlayStyle } from "@/lib/accessoryPlacement";
import PixelArt from "@/components/PixelArt";

interface PetAccessoryProps {
    /** `{petId}/{stage}/{moodFile}` — same key as the sprite path. */
    spriteKey: string;
    accessoryId: string;
}

/** Equipped accessory drawn over the pet sprite. Renders nothing if unplaceable. */
export default function PetAccessory({ spriteKey, accessoryId }: PetAccessoryProps) {
    const style = getAccessoryOverlayStyle(spriteKey, accessoryId);
    const art = ACCESSORY_ART[accessoryId];

    if (!style || !art) return null;

    return (
        <div className="pointer-events-none absolute z-10" style={style}>
            <motion.div
                key={accessoryId}
                initial={{ scale: 0, y: -16 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 16 }}
            >
                <PixelArt art={art} className="block w-full h-auto drop-shadow-sm" />
            </motion.div>
        </div>
    );
}
