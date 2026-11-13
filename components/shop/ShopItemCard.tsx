"use client";

import { motion } from "framer-motion";
import { Check, Coins } from "lucide-react";
import {
    getEffectLabels,
    isConsumableItem,
    type ShopCategory,
    type ShopItem,
} from "@/lib/shopConfig";
import ItemIcon from "./ItemIcon";

interface ShopItemCardProps {
    item: ShopItem;
    coins: number;
    quantity: number;
    isOwned: boolean;
    isEquipped: boolean;
    isPending: boolean;
    /** Changes on every successful purchase of this item to replay the pop. */
    purchaseNonce: number;
    onBuy: (item: ShopItem) => void;
    onToggleEquip: (item: ShopItem) => void;
}

export const CATEGORY_TINT: Record<ShopCategory, string> = {
    food: "bg-[#FFF0D9]",
    toy: "bg-[#FCE8ED]",
    accessory: "bg-[#F0E9FC]",
};

const SLOT_LABEL = { head: "Head accessory", face: "Face accessory" } as const;

export default function ShopItemCard({
    item,
    coins,
    quantity,
    isOwned,
    isEquipped,
    isPending,
    purchaseNonce,
    onBuy,
    onToggleEquip,
}: ShopItemCardProps) {
    const isConsumable = isConsumableItem(item);
    const isPermanentlyOwned = !isConsumable && isOwned;
    const shortfall = item.price - coins;
    const canAfford = shortfall <= 0;

    const details = isConsumable
        ? getEffectLabels(item.effects)
        : [SLOT_LABEL[item.slot], "Yours forever"];

    return (
        <article className="bg-white rounded-2xl p-4 shadow-sm flex gap-4">
            <div
                className={`relative shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${CATEGORY_TINT[item.category]}`}
            >
                <motion.span
                    key={purchaseNonce}
                    initial={purchaseNonce ? { scale: 0.6, rotate: -12 } : false}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 14 }}
                    className="text-3xl flex items-center justify-center"
                >
                    <ItemIcon item={item} />
                </motion.span>

                {isConsumable && quantity > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-6 h-6 px-1.5 rounded-full bg-[#493B32] text-white text-xs font-bold flex items-center justify-center">
                        ×{quantity}
                    </span>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-[#493B32] leading-tight">
                        {item.name}
                    </h3>

                    <span className="shrink-0 inline-flex items-center gap-1 text-sm font-bold text-[#94621D]">
                        <Coins size={14} aria-hidden />
                        {item.price}
                    </span>
                </div>

                <p className="text-xs text-[#927F72] mt-1">{item.description}</p>

                <ul className="flex flex-wrap gap-1.5 mt-2">
                    {details.map((label) => (
                        <li
                            key={label}
                            className="text-[11px] font-semibold text-[#493B32] bg-[#FFF9F0] rounded-full px-2 py-0.5"
                        >
                            {label}
                        </li>
                    ))}
                </ul>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {isPermanentlyOwned ? (
                        <>
                            <span
                                className={`inline-flex items-center gap-1.5 text-xs font-bold rounded-xl px-3 py-2 ${
                                    isEquipped
                                        ? "bg-[#493B32] text-white"
                                        : "bg-[#F0E9FC] text-[#493B32]"
                                }`}
                            >
                                <Check size={14} aria-hidden />
                                {isEquipped ? "Equipped" : "Owned"}
                            </span>

                            <button
                                type="button"
                                onClick={() => onToggleEquip(item)}
                                className="text-xs font-bold rounded-xl px-3 py-2 border-2 border-[#B08C70] text-[#B08C70] hover:bg-[#B08C70] hover:text-white transition-colors"
                            >
                                {isEquipped ? "Take off" : "Equip"}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onBuy(item)}
                            disabled={!canAfford || isPending}
                            className="w-full sm:w-auto text-sm font-bold rounded-xl px-4 py-2 transition-colors bg-[#B08C70] text-white hover:bg-[#98745A] disabled:bg-[#EFE6DC] disabled:text-[#A58E7D] disabled:cursor-not-allowed"
                        >
                            {canAfford
                                ? isPending
                                    ? "Added!"
                                    : quantity > 0
                                        ? "Buy another"
                                        : "Buy"
                                : `Need ${shortfall} more`}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
