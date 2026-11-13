"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Package, X } from "lucide-react";
import { usePetStore } from "@/store/petStore";
import {
    EQUIP_FAILURE_MESSAGES,
    PURCHASE_FAILURE_MESSAGES,
    USE_ITEM_FAILURE_MESSAGES,
    getEffectLabels,
    SHOP_CATEGORIES,
    getItemsByCategory,
    isAccessoryItem,
    type ShopCategory,
    type ShopItem,
} from "@/lib/shopConfig";
import ShopItemCard from "./ShopItemCard";
import InventoryPanel from "./InventoryPanel";

type ShopTab = ShopCategory | "inventory";

interface ShopToast {
    id: number;
    message: string;
    tone: "success" | "error";
}

interface PetShopProps {
    onClose: () => void;
}

/** Brief lock after a purchase or use so a double-click reads as one action. */
const PURCHASE_LOCK_MS = 450;
const TOAST_DURATION_MS = 2200;

export default function PetShop({ onClose }: PetShopProps) {
    const coins = usePetStore((state) => state.coins);
    const inventory = usePetStore((state) => state.inventory);
    const ownedAccessories = usePetStore((state) => state.ownedAccessories);
    const equippedAccessory = usePetStore((state) => state.equippedAccessory);
    const purchaseItem = usePetStore((state) => state.purchaseItem);
    const consumeItem = usePetStore((state) => state.consumeItem);
    const equipAccessory = usePetStore((state) => state.equipAccessory);
    const unequipAccessory = usePetStore((state) => state.unequipAccessory);
    const petName = usePetStore((state) => state.adoptedPet?.customName ?? "Your pet");
    const isPetSleeping = usePetStore((state) => state.adoptedPet?.isSleeping ?? false);

    const [activeTab, setActiveTab] = useState<ShopTab>("food");
    const [pendingItemId, setPendingItemId] = useState<string | null>(null);
    const [purchaseNonces, setPurchaseNonces] = useState<Record<string, number>>({});
    const [toast, setToast] = useState<ShopToast | null>(null);

    const toastIdRef = useRef(0);
    const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(
        () => () => {
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        },
        []
    );

    const showToast = (message: string, tone: ShopToast["tone"]) => {
        toastIdRef.current += 1;
        setToast({ id: toastIdRef.current, message, tone });
    };

    const lockItem = (itemId: string) => {
        setPendingItemId(itemId);
        if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        lockTimerRef.current = setTimeout(
            () => setPendingItemId(null),
            PURCHASE_LOCK_MS
        );
    };

    const handleUse = (item: ShopItem) => {
        if (pendingItemId) return;

        const result = consumeItem(item.id);

        if (!result.ok) {
            showToast(USE_ITEM_FAILURE_MESSAGES[result.reason], "error");
            return;
        }

        const verb = result.item.category === "food" ? "ate" : "played with";
        const effects = getEffectLabels(result.applied).join(" · ");

        showToast(
            `${item.emoji} ${petName} ${verb} the ${item.name.toLowerCase()}! ${effects}`,
            "success"
        );
        lockItem(item.id);
    };

    const handleToggleEquip = (item: ShopItem) => {
        if (equippedAccessory === item.id) {
            unequipAccessory();
            showToast(`${item.name} taken off.`, "success");
            return;
        }

        const result = equipAccessory(item.id);

        showToast(
            result.ok
                ? `${petName} is wearing the ${item.name.toLowerCase()}!`
                : EQUIP_FAILURE_MESSAGES[result.reason],
            result.ok ? "success" : "error"
        );
    };

    const handleBuy = (item: ShopItem) => {
        if (pendingItemId) return;

        // The store re-validates everything; the UI only reflects the result.
        const result = purchaseItem(item.id);

        if (!result.ok) {
            showToast(PURCHASE_FAILURE_MESSAGES[result.reason], "error");
            return;
        }

        showToast(
            `${item.emoji} ${item.name} added to your ${
                isAccessoryItem(item) ? "wardrobe" : "inventory"
            }!`,
            "success"
        );

        setPurchaseNonces((previous) => ({
            ...previous,
            [item.id]: (previous[item.id] ?? 0) + 1,
        }));

        lockItem(item.id);
    };

    const inventoryCount =
        Object.values(inventory).reduce((total, quantity) => total + quantity, 0) +
        ownedAccessories.length;

    const tabs: { id: ShopTab; label: string; emoji?: string }[] = [
        ...SHOP_CATEGORIES,
        { id: "inventory", label: "Inventory" },
    ];

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
            onClick={onClose}
        >
            <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="pet-shop-title"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                onClick={(event) => event.stopPropagation()}
                className="relative w-full max-w-2xl h-[88dvh] sm:h-[min(680px,90dvh)] bg-[#FFF9F0] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <header className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-[#A58E7D]">
                            PIXEL MARKET
                        </p>
                        <h2
                            id="pet-shop-title"
                            className="text-2xl font-black text-[#493B32]"
                        >
                            Pet Shop
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <motion.div
                            key={coins}
                            initial={{ scale: 1.15 }}
                            animate={{ scale: 1 }}
                            className="bg-[#FFF0D9] rounded-full px-4 py-2 text-sm font-bold text-[#94621D] inline-flex items-center gap-2"
                            aria-label={`${coins} coins`}
                        >
                            <Coins size={16} aria-hidden />
                            {coins}
                        </motion.div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white text-[#493B32] flex items-center justify-center hover:bg-[#F7EFE4] transition-colors"
                            aria-label="Close shop"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <nav
                    role="tablist"
                    aria-label="Shop sections"
                    className="grid grid-cols-4 gap-1.5 px-5 mt-4 pb-1 sm:flex sm:gap-2 sm:px-6"
                >
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative min-w-0 rounded-2xl px-1 py-2 text-[11px] font-bold transition-colors sm:shrink-0 sm:rounded-full sm:px-4 sm:text-sm ${
                                    isActive
                                        ? "text-white"
                                        : "text-[#493B32] bg-white hover:bg-[#F7EFE4]"
                                }`}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="shop-tab-pill"
                                        className="absolute inset-0 rounded-2xl bg-[#B08C70] sm:rounded-full"
                                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                    />
                                )}

                                <span className="relative flex flex-col items-center gap-0.5 sm:flex-row sm:gap-1.5">
                                    {tab.emoji ? (
                                        <span aria-hidden>{tab.emoji}</span>
                                    ) : (
                                        <Package size={15} aria-hidden />
                                    )}
                                    {tab.label}
                                    {tab.id === "inventory" && inventoryCount > 0 && (
                                        <span
                                            className={`absolute -top-1.5 -right-0.5 min-w-5 h-5 px-1 rounded-full text-[11px] flex items-center justify-center sm:static ${
                                                isActive
                                                    ? "bg-white text-[#B08C70]"
                                                    : "bg-[#B08C70] text-white"
                                            }`}
                                        >
                                            {inventoryCount}
                                        </span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* Content */}
                <div role="tabpanel" className="flex-1 overflow-y-auto px-5 sm:px-6 pt-5 pb-20">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                        >
                            {activeTab === "inventory" ? (
                                <InventoryPanel
                                    inventory={inventory}
                                    ownedAccessories={ownedAccessories}
                                    equippedAccessory={equippedAccessory}
                                    petName={petName}
                                    isPetSleeping={isPetSleeping}
                                    busyItemId={pendingItemId}
                                    onUse={handleUse}
                                    onToggleEquip={handleToggleEquip}
                                    onBrowseShop={() => setActiveTab("food")}
                                />
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {getItemsByCategory(activeTab).map((item) => (
                                        <ShopItemCard
                                            key={item.id}
                                            item={item}
                                            coins={coins}
                                            quantity={inventory[item.id] ?? 0}
                                            isOwned={ownedAccessories.includes(item.id)}
                                            isEquipped={equippedAccessory === item.id}
                                            isPending={pendingItemId === item.id}
                                            purchaseNonce={purchaseNonces[item.id] ?? 0}
                                            onBuy={handleBuy}
                                            onToggleEquip={handleToggleEquip}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Feedback toast */}
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4"
                    aria-live="polite"
                >
                    <AnimatePresence>
                        {toast && (
                            <motion.p
                                key={toast.id}
                                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.2 }}
                                className={`rounded-full px-4 py-2 text-sm font-bold shadow-lg ${
                                    toast.tone === "success"
                                        ? "bg-[#493B32] text-white"
                                        : "bg-[#FCE8ED] text-[#9B3D55]"
                                }`}
                            >
                                {toast.message}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
