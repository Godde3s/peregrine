import { Easing } from 'react-native-reanimated';

/**
 * One spring vocabulary per app (motion laws).
 * SNAP — critically damped, settles without oscillation.
 * POP  — one soft overshoot, used sparingly (never on data, only delight).
 * Gesture releases must hand their velocity into these via `velocity`.
 */
export const SPRING_SNAP = { duration: 400, dampingRatio: 1 } as const;
export const SPRING_POP = { duration: 400, dampingRatio: 0.8 } as const;

/** Strong ease-out for timing-driven entrances — built-in curves are too weak. */
export const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

/** Entrances ~220 ms, exits faster than entrances (~0.7x). */
export const DUR_ENTER = 220;
export const DUR_EXIT = 150;

/** Press feedback lands on press-in: scale 0.97 for buttons/cards. */
export const PRESS_SCALE = 0.97;
export const PRESS_IN_MS = 120;

/** List entrance stagger — capped at ~8 items, beyond that enter as a block. */
export const stagger = (index: number): number => Math.min(index, 8) * 40;
