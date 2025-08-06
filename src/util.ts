export { not, elem, except, RNGlazySequence, Position, attr };
import { RNGLazySequence } from "./type";

// taken from FSP asteroid course note
const not =
    <T>(f: (x: T) => boolean) =>
    (x: T) =>
        !f(x);

export type WithId = { id: string | number };

// taken from FSP asteroid course note
const elem =
    <T extends WithId>(a: ReadonlyArray<T>) =>
    (e: T) =>
        a.findIndex((n) => n.id === e.id) >= 0;

// taken from FSP asteroid course note
const except =
    <T extends WithId>(a: ReadonlyArray<T>) =>
    (b: ReadonlyArray<T>): ReadonlyArray<T> =>
        a.filter(not(elem(b)));

// taken from applied week 4
abstract class RNG {
    // LCG using GCC's constants
    private static m = 0x80000000; // 2**31
    private static a = 1103515245;
    private static c = 12345;

    /**
     * Call `hash` repeatedly to generate the sequence of hashes.
     * @param seed
     * @returns a hash of the seed
     */
    public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

    /**
     * Takes hash value and scales it to the range [0, 0.5]
     */
    public static scale = (hash: number) => hash / (2 * RNG.m - 2);
}

// Creates a lazy sequence of random numbers based on an initial seed.
const RNGlazySequence = (seed: number): RNGLazySequence => {
    const nextSeed = RNG.hash(seed);
    return () => ({
        value: RNG.scale(nextSeed),
        next: RNGlazySequence(nextSeed),
    });
};

class Position {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // Method to return a new Position after increasing x and y
    move(deltaX: number, deltaY: number): Position {
        return new Position(this.x + deltaX, this.y + deltaY);
    }
}

// taken from FSP asteroid course note
const attr = (e: Element | null, o: { [p: string]: unknown }) => {
    for (const k in o) e?.setAttribute(k, String(o[k]));
};
