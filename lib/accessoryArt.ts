/**
 * Pixel-art accessories, drawn as character grids so they match the pet
 * sprites and scale crisply. "." is transparent; other characters map to the
 * palette.
 */

export interface PixelArtData {
    rows: readonly string[];
    palette: Readonly<Record<string, string>>;
}

export const ACCESSORY_ART: Record<string, PixelArtData> = {
    "crown": {
        rows: [
            "K.....KK.....K",
            "KK...KYYK...KK",
            "KYK.KYYYYK.KYK",
            "KYYKYYYYYYKYYK",
            "KYYYYYYYYYYYYK",
            "KYRYYYBBYYYRYK",
            "KYYYYYYYYYYYYK",
            "KOOOOOOOOOOOOK",
            "KKKKKKKKKKKKKK",
        ],
        palette: { K: "#493B32", Y: "#FFC93C", O: "#E0A21B", R: "#E5484D", B: "#4FA3F7" },
    },
    "party-hat": {
        rows: [
            ".....YY.....",
            "....YYYY....",
            ".....YY.....",
            ".....KK.....",
            "....KPPK....",
            "....KBBK....",
            "...KPPPPK...",
            "...KYYBBK...",
            "..KPPPPPPK..",
            "..KBBBYYBK..",
            ".KPPPPPPPPK.",
            ".KYYBBBBPPK.",
            "KKKKKKKKKKKK",
        ],
        palette: { K: "#493B32", Y: "#FFD25A", P: "#F27BA0", B: "#7FC8F8" },
    },
    "wizard-hat": {
        rows: [
            "........KK....",
            ".......KPK....",
            "......KPPK....",
            "......KPPPK...",
            ".....KPPYPK...",
            ".....KPYYYPK..",
            "....KPPPYPPK..",
            "....KPPPPPPK..",
            "...KPPPPPPPPK.",
            "...KDDDDDDDDK.",
            "KKKKKKKKKKKKKK",
            "KPPPPPPPPPPPPK",
            "KKKKKKKKKKKKKK",
        ],
        palette: { K: "#493B32", P: "#8C6BD8", Y: "#FFD25A", D: "#5B3FA8" },
    },
    "bow": {
        rows: [
            ".KK........KK.",
            "KPPK......KPPK",
            "KPPPKKKKKKPPPK",
            "KPPPPKDDKPPPPK",
            "KPPPPKDDKPPPPK",
            "KPPPKKKKKKPPPK",
            "KPPK......KPPK",
            ".KK........KK.",
        ],
        palette: { K: "#493B32", P: "#F27BA0", D: "#D9577F" },
    },
    "sunglasses": {
        rows: [
            "KKKKKKKKKKKKKKKK",
            "KLLSLLK..KLLSLLK",
            "KLLLLLK..KLLLLLK",
            ".KLLLK....KLLLK.",
            "..KKK......KKK..",
        ],
        palette: { K: "#2B2233", L: "#3B3350", S: "#8E86A8" },
    },
};
