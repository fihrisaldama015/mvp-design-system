import { interpolate } from "remotion";

/** 0 -> 1 between frames a and b (clamped). */
export const ramp = (f: number, a: number, b: number) => interpolate(f, [a, Math.max(b, a + 1)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** 1 while f is in [a, b), with 12-frame fades on both edges. `b` = Infinity keeps it on. */
export const window12 = (f: number, a: number, b: number, fade = 12) => ramp(f, a, a + fade) * (b === Infinity ? 1 : 1 - ramp(f, b - fade, b));
