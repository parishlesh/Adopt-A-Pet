/**
 * Where accessories sit on each pet sprite.
 *
 * Every sprite is framed differently (pose, crop, size), so a per-file anchor
 * table is the only reliable way to place an overlay. Values are percentages
 * of the square sprite box and were set by rendering every accessory onto
 * every sprite and checking the result visually.
 *
 * Keys match the sprite path: `{petId}/{stage}/{moodFile}`.
 */

import type { AccessorySlot } from "@/lib/shopConfig";

/** x = centre, y = top of skull (head) or eye line (face), w = feature width. */
export interface SpriteAnchor {
    x: number;
    y: number;
    w: number;
}

type SpriteAnchors = Record<AccessorySlot, SpriteAnchor>;

const anchor = (
    head: [number, number, number],
    face: [number, number, number]
): SpriteAnchors => ({
    head: { x: head[0], y: head[1], w: head[2] },
    face: { x: face[0], y: face[1], w: face[2] },
});

export const SPRITE_ANCHORS: Record<string, SpriteAnchors> = {
    // mochi
    "mochi/baby/happy": anchor([49, 29, 39], [50, 37, 22]),
    "mochi/baby/okay": anchor([48.5, 28, 39], [49, 40, 22]),
    "mochi/baby/hungry": anchor([47, 29, 39], [50, 41, 22]),
    "mochi/baby/sad": anchor([49, 28, 39], [50.5, 42, 22]),
    "mochi/baby/sleepy": anchor([45, 33, 40], [46, 52, 24]),
    "mochi/teen/happy": anchor([45, 33, 42], [45, 44, 26]),
    "mochi/teen/okay": anchor([51, 35, 40], [51, 46, 24]),
    "mochi/teen/hungry": anchor([48, 34, 41], [49, 46, 24]),
    "mochi/teen/sad": anchor([48, 34, 42], [49, 45, 24]),
    "mochi/teen/sleepy": anchor([36, 36, 48], [38, 57, 28]),
    "mochi/adult/happy": anchor([41, 27, 52], [41, 40, 30]),
    "mochi/adult/okay": anchor([52, 24, 56], [53, 47, 32]),
    "mochi/adult/hungry": anchor([46, 26, 54], [47, 47, 30]),
    "mochi/adult/sad": anchor([44, 28, 52], [43, 49, 30]),
    "mochi/adult/sleepy": anchor([40, 32, 50], [40, 50, 30]),
    // bubbles
    "bubbles/baby/happy": anchor([52, 27, 44], [51, 46, 30]),
    "bubbles/baby/okay": anchor([52, 26, 44], [51, 46, 30]),
    "bubbles/baby/hungry": anchor([53, 26, 44], [53, 48, 30]),
    "bubbles/baby/sad": anchor([53, 26, 44], [52, 47, 30]),
    "bubbles/baby/sleepy": anchor([44, 41, 36], [50, 60, 28]),
    "bubbles/teen/happy": anchor([50, 30, 42], [50, 42, 26]),
    "bubbles/teen/okay": anchor([53, 28, 42], [51, 43, 26]),
    "bubbles/teen/hungry": anchor([52, 28, 42], [54, 40, 26]),
    "bubbles/teen/sad": anchor([54, 28, 44], [51, 44, 28]),
    "bubbles/teen/sleepy": anchor([40, 40, 32], [60, 62, 26]),
    "bubbles/adult/happy": anchor([45, 20, 36], [44, 31, 22]),
    "bubbles/adult/okay": anchor([48, 20, 38], [47, 33, 22]),
    "bubbles/adult/hungry": anchor([47, 21, 38], [47, 33, 22]),
    "bubbles/adult/sad": anchor([48, 22, 38], [48, 37, 22]),
    "bubbles/adult/sleepy": anchor([52, 41, 40], [60, 57, 26]),
    // pickle
    "pickle/baby/happy": anchor([48, 30, 40], [48, 36, 26]),
    "pickle/baby/okay": anchor([48, 30, 40], [48, 38, 24]),
    "pickle/baby/hungry": anchor([44, 30, 38], [44, 37, 24]),
    "pickle/baby/sad": anchor([47, 32, 40], [47, 39, 26]),
    "pickle/baby/sleepy": anchor([46, 34, 46], [44, 46, 28]),
    "pickle/teen/happy": anchor([38, 28, 56], [38, 33, 36]),
    "pickle/teen/okay": anchor([51, 20, 56], [51, 28, 38]),
    "pickle/teen/hungry": anchor([42, 26, 50], [42, 36, 36]),
    "pickle/teen/sad": anchor([50, 27, 60], [50, 42, 44]),
    "pickle/teen/sleepy": anchor([45, 33, 54], [42, 48, 34]),
    "pickle/adult/happy": anchor([46, 24, 62], [45, 30, 40]),
    "pickle/adult/okay": anchor([50, 14, 66], [50, 26, 48]),
    "pickle/adult/hungry": anchor([49, 20, 62], [49, 30, 42]),
    "pickle/adult/sad": anchor([50, 9, 80], [50, 33, 60]),
    "pickle/adult/sleepy": anchor([46, 26, 62], [42, 43, 42]),
};

export interface AccessoryPlacement {
    slot: AccessorySlot;
    /** Rendered width as a fraction of the anchor's width. */
    scale: number;
    /** Horizontal offset as a fraction of the anchor's width. */
    offsetX: number;
    /** Vertical offset in % of the box (positive = lower). */
    offsetY: number;
    /** "bottom": item rests on the anchor line (hats). "center": centred on it. */
    align: "bottom" | "center";
    rotate: number;
}

/** Hats never grow wider than this (% of the box) on very large sprites. */
const MAX_HEAD_ITEM_WIDTH = 34;

export const ACCESSORY_PLACEMENT: Record<string, AccessoryPlacement> = {
    "crown": { slot: "head", scale: 0.55, offsetX: 0, offsetY: 3, align: "bottom", rotate: 0 },
    "party-hat": { slot: "head", scale: 0.4, offsetX: 0.12, offsetY: 3, align: "bottom", rotate: 12 },
    "wizard-hat": { slot: "head", scale: 0.62, offsetX: 0, offsetY: 4, align: "bottom", rotate: 0 },
    "bow": { slot: "head", scale: 0.32, offsetX: -0.3, offsetY: -4, align: "center", rotate: -12 },
    "sunglasses": { slot: "face", scale: 1.35, offsetX: 0, offsetY: 0, align: "center", rotate: 0 },
};

export interface AccessoryOverlayStyle {
    left: string;
    top: string;
    width: string;
    transform: string;
}

/** Absolute-position style for an accessory on a sprite, or null if unknown. */
export function getAccessoryOverlayStyle(
    spriteKey: string,
    accessoryId: string
): AccessoryOverlayStyle | null {
    const anchors = SPRITE_ANCHORS[spriteKey];
    const placement = ACCESSORY_PLACEMENT[accessoryId];
    if (!anchors || !placement) return null;

    const { x, y, w } = anchors[placement.slot];
    const rawWidth = w * placement.scale;
    const width =
        placement.slot === "head"
            ? Math.min(rawWidth, MAX_HEAD_ITEM_WIDTH)
            : rawWidth;

    const translateY = placement.align === "bottom" ? "-100%" : "-50%";

    return {
        left: `${x + placement.offsetX * w}%`,
        top: `${y + placement.offsetY}%`,
        width: `${width}%`,
        transform: `translate(-50%, ${translateY}) rotate(${placement.rotate}deg)`,
    };
}
