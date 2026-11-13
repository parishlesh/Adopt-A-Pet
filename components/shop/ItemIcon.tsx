import { ACCESSORY_ART } from "@/lib/accessoryArt";
import type { ShopItem } from "@/lib/shopConfig";
import PixelArt from "@/components/PixelArt";

interface ItemIconProps {
    item: ShopItem;
    /** Tailwind size classes for the pixel-art version, e.g. "w-10". */
    artClassName?: string;
}

/** Accessories use their pixel art (what the pet actually wears); consumables use emoji. */
export default function ItemIcon({ item, artClassName = "w-10" }: ItemIconProps) {
    const art = item.category === "accessory" ? ACCESSORY_ART[item.id] : undefined;

    return art ? (
        <PixelArt art={art} className={`${artClassName} h-auto`} />
    ) : (
        <span aria-hidden>{item.emoji}</span>
    );
}
