"use client";

import { Check, Moon, Package } from "lucide-react";
import {
    ACCESSORY_ITEMS,
    FOOD_ITEMS,
    TOY_ITEMS,
    getEffectLabels,
    type Inventory,
    type ShopItem,
} from "@/lib/shopConfig";
import { CATEGORY_TINT } from "./ShopItemCard";
import ItemIcon from "./ItemIcon";

interface InventoryPanelProps {
    inventory: Inventory;
    ownedAccessories: string[];
    equippedAccessory: string | null;
    petName: string;
    isPetSleeping: boolean;
    busyItemId: string | null;
    onUse: (item: ShopItem) => void;
    onToggleEquip: (item: ShopItem) => void;
    onBrowseShop: () => void;
}

export default function InventoryPanel({
    inventory,
    ownedAccessories,
    equippedAccessory,
    petName,
    isPetSleeping,
    busyItemId,
    onUse,
    onToggleEquip,
    onBrowseShop,
}: InventoryPanelProps) {
    // Catalogue order keeps the list stable regardless of purchase order.
    const consumables = [...FOOD_ITEMS, ...TOY_ITEMS].filter(
        (item) => (inventory[item.id] ?? 0) > 0
    );
    const accessories = ACCESSORY_ITEMS.filter((item) =>
        ownedAccessories.includes(item.id)
    );

    if (consumables.length === 0 && accessories.length === 0) {
        return (
            <div className="text-center py-12">
                <Package size={40} className="mx-auto text-[#B08C70]" aria-hidden />
                <p className="font-bold text-[#493B32] mt-3">
                    Your inventory is empty
                </p>
                <p className="text-sm text-[#927F72] mt-1">
                    Treats, toys and accessories you buy will show up here.
                </p>
                <button
                    type="button"
                    onClick={onBrowseShop}
                    className="mt-5 bg-[#B08C70] hover:bg-[#98745A] text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                    Browse the shop
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {consumables.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold tracking-widest text-[#A58E7D]">
                            SNACKS &amp; TOYS
                        </h3>

                        {isPetSleeping && (
                            <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500">
                                <Moon size={12} aria-hidden />
                                {petName} is asleep
                            </p>
                        )}
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {consumables.map((item) => (
                            <li
                                key={item.id}
                                className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3"
                            >
                                <span
                                    className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl ${CATEGORY_TINT[item.category]}`}
                                >
                                    <ItemIcon item={item} />
                                </span>

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-[#493B32] text-sm">
                                        {item.name}{" "}
                                        <span className="text-[#A58E7D] font-semibold">
                                            ×{inventory[item.id]}
                                        </span>
                                    </p>
                                    <p className="text-[11px] text-[#927F72] truncate">
                                        {getEffectLabels(item.effects).join(" · ")}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => onUse(item)}
                                    disabled={isPetSleeping || busyItemId === item.id}
                                    className="shrink-0 text-xs font-bold rounded-xl px-3 py-2 bg-[#B08C70] text-white hover:bg-[#98745A] transition-colors disabled:bg-[#EFE6DC] disabled:text-[#A58E7D] disabled:cursor-not-allowed"
                                >
                                    {item.category === "food" ? "Feed" : "Play"}
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {accessories.length > 0 && (
                <section>
                    <h3 className="text-xs font-bold tracking-widest text-[#A58E7D] mb-3">
                        WARDROBE
                    </h3>

                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {accessories.map((item) => {
                            const isEquipped = equippedAccessory === item.id;

                            return (
                                <li
                                    key={item.id}
                                    className={`bg-white rounded-2xl p-3 shadow-sm text-center border-2 transition-colors ${
                                        isEquipped
                                            ? "border-[#B08C70]"
                                            : "border-transparent"
                                    }`}
                                >
                                    <span className="h-10 flex items-center justify-center text-3xl">
                                        <ItemIcon item={item} />
                                    </span>
                                    <p className="font-bold text-[#493B32] text-sm mt-1">
                                        {item.name}
                                    </p>

                                    {isEquipped && (
                                        <p className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B08C70] mt-0.5">
                                            <Check size={12} aria-hidden />
                                            Equipped
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => onToggleEquip(item)}
                                        className={`mt-2 w-full text-xs font-bold rounded-xl px-3 py-2 transition-colors ${
                                            isEquipped
                                                ? "border-2 border-[#B08C70] text-[#B08C70] hover:bg-[#FFF9F0]"
                                                : "bg-[#B08C70] text-white hover:bg-[#98745A]"
                                        }`}
                                    >
                                        {isEquipped ? "Take off" : "Equip"}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}
        </div>
    );
}
