/**
 * Pet Shop catalogue and shared shop types.
 *
 * Every price, effect and description lives here so balancing the
 * economy never requires touching UI components or store logic.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ShopCategory = "food" | "toy" | "accessory";

export type ConsumableCategory = Exclude<ShopCategory, "accessory">;

export type StatKey = "hunger" | "happiness" | "energy";

/** Positive values restore a stat, negative values cost it. */
export type StatEffects = Partial<Record<StatKey, number>>;

export type AccessorySlot = "head" | "face";

interface BaseShopItem {
    id: string;
    name: string;
    emoji: string;
    description: string;
    price: number;
}

/** Food and toys: stacked in inventory, consumed on use. */
export interface ConsumableShopItem extends BaseShopItem {
    category: ConsumableCategory;
    effects: StatEffects;
}

/** Accessories: bought once, owned permanently, equipped cosmetically. */
export interface AccessoryShopItem extends BaseShopItem {
    category: "accessory";
    slot: AccessorySlot;
}

export type ShopItem = ConsumableShopItem | AccessoryShopItem;

/** itemId -> quantity. Only consumables are stored here. */
export type Inventory = Record<string, number>;

export type PurchaseFailureReason =
    | "NOT_READY"
    | "INVALID_ITEM"
    | "NO_PET"
    | "INSUFFICIENT_COINS"
    | "ALREADY_OWNED";

export type PurchaseResult =
    | { ok: true; item: ShopItem }
    | { ok: false; reason: PurchaseFailureReason };

export type UseItemFailureReason =
    | "NOT_READY"
    | "INVALID_ITEM"
    | "NO_PET"
    | "NOT_IN_INVENTORY"
    | "PET_SLEEPING"
    | "STAT_FULL"
    | "TOO_TIRED";

export type UseItemResult =
    | { ok: true; item: ConsumableShopItem; applied: StatEffects }
    | { ok: false; reason: UseItemFailureReason };

export type EquipFailureReason = "NOT_READY" | "INVALID_ITEM" | "NOT_OWNED";

export type EquipResult =
    | { ok: true; item: AccessoryShopItem }
    | { ok: false; reason: EquipFailureReason };

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

export const FOOD_ITEMS: readonly ConsumableShopItem[] = [
    {
        id: "apple",
        category: "food",
        name: "Apple",
        emoji: "🍎",
        description: "A crunchy little snack.",
        price: 5,
        effects: { hunger: 10 },
    },
    {
        id: "berries",
        category: "food",
        name: "Berries",
        emoji: "🫐",
        description: "A handful of sweet, juicy berries.",
        price: 10,
        effects: { hunger: 20 },
    },
    {
        id: "cake",
        category: "food",
        name: "Cake",
        emoji: "🍰",
        description: "A fluffy treat for special days.",
        price: 20,
        effects: { hunger: 30, happiness: 5 },
    },
    {
        id: "golden-treat",
        category: "food",
        name: "Golden Treat",
        emoji: "🌟",
        description: "The fanciest snack in the shop.",
        price: 35,
        effects: { hunger: 40, happiness: 10 },
    },
];

/** Toys are single-use and cost a little energy, like a short play session. */
export const TOY_ITEMS: readonly ConsumableShopItem[] = [
    {
        id: "ball",
        category: "toy",
        name: "Ball",
        emoji: "⚽",
        description: "Bouncy fun for a quick game.",
        price: 10,
        effects: { happiness: 10, energy: -5 },
    },
    {
        id: "teddy-bear",
        category: "toy",
        name: "Teddy Bear",
        emoji: "🧸",
        description: "A soft friend to cuddle.",
        price: 20,
        effects: { happiness: 20, energy: -5 },
    },
    {
        id: "music-box",
        category: "toy",
        name: "Music Box",
        emoji: "🎶",
        description: "Plays a tiny, cheerful tune.",
        price: 35,
        effects: { happiness: 30, energy: -5 },
    },
    {
        id: "magic-wand",
        category: "toy",
        name: "Magic Wand",
        emoji: "🪄",
        description: "Sparkles that make everything better.",
        price: 50,
        effects: { happiness: 40, energy: -5 },
    },
];

export const ACCESSORY_ITEMS: readonly AccessoryShopItem[] = [
    {
        id: "bow",
        category: "accessory",
        name: "Bow",
        emoji: "🎀",
        description: "A cute ribbon for everyday style.",
        price: 25,
        slot: "head",
    },
    {
        id: "party-hat",
        category: "accessory",
        name: "Party Hat",
        emoji: "🎉",
        description: "Every day is a celebration.",
        price: 30,
        slot: "head",
    },
    {
        id: "sunglasses",
        category: "accessory",
        name: "Sunglasses",
        emoji: "🕶️",
        description: "Too cool for the sun.",
        price: 40,
        slot: "face",
    },
    {
        id: "wizard-hat",
        category: "accessory",
        name: "Wizard Hat",
        emoji: "🔮",
        description: "For pets with a magical side.",
        price: 75,
        slot: "head",
    },
    {
        id: "crown",
        category: "accessory",
        name: "Crown",
        emoji: "👑",
        description: "Royalty, obviously.",
        price: 100,
        slot: "head",
    },
];

/**
 * The stat a consumable is "for". If it's already at 100 the item is
 * refused and not consumed (mirrors the dashboard Feed rule).
 */
export const PRIMARY_STAT: Record<ConsumableCategory, StatKey> = {
    food: "hunger",
    toy: "happiness",
};

export const SHOP_ITEMS: readonly ShopItem[] = [
    ...FOOD_ITEMS,
    ...TOY_ITEMS,
    ...ACCESSORY_ITEMS,
];

export const SHOP_CATEGORIES: readonly {
    id: ShopCategory;
    label: string;
    emoji: string;
}[] = [
        { id: "food", label: "Food", emoji: "🍎" },
        { id: "toy", label: "Toys", emoji: "🧸" },
        { id: "accessory", label: "Accessories", emoji: "🎀" },
    ];

// ---------------------------------------------------------------------------
// Lookups & guards
// ---------------------------------------------------------------------------

const SHOP_ITEM_MAP: ReadonlyMap<string, ShopItem> = new Map(
    SHOP_ITEMS.map((item) => [item.id, item])
);

export const getShopItem = (id: string): ShopItem | undefined =>
    SHOP_ITEM_MAP.get(id);

export const getItemsByCategory = (category: ShopCategory): ShopItem[] =>
    SHOP_ITEMS.filter((item) => item.category === category);

export const isConsumableItem = (
    item: ShopItem
): item is ConsumableShopItem => item.category !== "accessory";

export const isAccessoryItem = (
    item: ShopItem
): item is AccessoryShopItem => item.category === "accessory";

export const getConsumableItem = (
    id: string
): ConsumableShopItem | undefined => {
    const item = getShopItem(id);
    return item && isConsumableItem(item) ? item : undefined;
};

export const getAccessoryItem = (
    id: string
): AccessoryShopItem | undefined => {
    const item = getShopItem(id);
    return item && isAccessoryItem(item) ? item : undefined;
};

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const STAT_LABELS: Record<StatKey, string> = {
    hunger: "Fullness",
    happiness: "Happiness",
    energy: "Energy",
};

/** e.g. { hunger: 30, happiness: 5 } -> ["Fullness +30", "Happiness +5"] */
export const getEffectLabels = (effects: StatEffects): string[] =>
    (Object.keys(STAT_LABELS) as StatKey[])
        .filter((stat) => effects[stat] !== undefined && effects[stat] !== 0)
        .map((stat) => {
            const value = effects[stat] ?? 0;
            return `${STAT_LABELS[stat]} ${value > 0 ? "+" : ""}${value}`;
        });

const NOT_READY_MESSAGE = "Still loading your save. Try again in a moment.";

export const PURCHASE_FAILURE_MESSAGES: Record<PurchaseFailureReason, string> = {
    NOT_READY: NOT_READY_MESSAGE,
    INVALID_ITEM: "That item isn't sold here.",
    NO_PET: "Adopt a pet before shopping.",
    INSUFFICIENT_COINS: "Not enough coins yet.",
    ALREADY_OWNED: "You already own this.",
};

export const USE_ITEM_FAILURE_MESSAGES: Record<UseItemFailureReason, string> = {
    NOT_READY: NOT_READY_MESSAGE,
    INVALID_ITEM: "That item can't be used.",
    NO_PET: "Adopt a pet first.",
    NOT_IN_INVENTORY: "You don't have any of these left.",
    PET_SLEEPING: "Shhh, your pet is sleeping.",
    STAT_FULL: "Your pet doesn't need this right now.",
    TOO_TIRED: "Your pet is too tired to play.",
};

export const EQUIP_FAILURE_MESSAGES: Record<EquipFailureReason, string> = {
    NOT_READY: NOT_READY_MESSAGE,
    INVALID_ITEM: "That isn't an accessory.",
    NOT_OWNED: "Buy this accessory first.",
};

// Accessory art and on-sprite placement live in lib/accessoryArt.ts and
// lib/accessoryPlacement.ts.
