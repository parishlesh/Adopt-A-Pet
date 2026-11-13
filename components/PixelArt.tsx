import type { PixelArtData } from "@/lib/accessoryArt";

interface PixelArtProps {
    art: PixelArtData;
    className?: string;
    /** Accessible label; omit for decorative use. */
    title?: string;
}

interface PixelRun {
    x: number;
    y: number;
    length: number;
    color: string;
}

/** Merge horizontal runs of the same colour so a row is a few rects, not one per pixel. */
const toRuns = ({ rows, palette }: PixelArtData): PixelRun[] => {
    const runs: PixelRun[] = [];

    rows.forEach((row, y) => {
        let x = 0;

        while (x < row.length) {
            const char = row[x];
            let length = 1;

            while (row[x + length] === char) length++;

            const color = palette[char];
            if (char !== "." && color) runs.push({ x, y, length, color });

            x += length;
        }
    });

    return runs;
};

export default function PixelArt({ art, className, title }: PixelArtProps) {
    const width = art.rows[0]?.length ?? 0;
    const height = art.rows.length;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={className}
            shapeRendering="crispEdges"
            role={title ? "img" : undefined}
            aria-label={title}
            aria-hidden={title ? undefined : true}
        >
            {toRuns(art).map((run) => (
                <rect
                    key={`${run.x}-${run.y}`}
                    x={run.x}
                    y={run.y}
                    width={run.length}
                    height={1}
                    fill={run.color}
                />
            ))}
        </svg>
    );
}
