import * as Haptics from 'expo-haptics';

/**
 * Haptics are punctuation (fidelity law 10): one per user action, on the
 * same frame as the visual, never on scroll, never in loops.
 */
const safe = (fn: () => Promise<void>): void => {
  void fn().catch(() => {});
};

/** Selection tick — value passes a step, segmented choice, toggle. */
export const hapticTick = (): void => safe(Haptics.selectionAsync);

/** Light impact — something snaps home (send, mark done, sheet land). */
export const hapticTap = (): void =>
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

/** Medium impact — heavier snapping (delete armed, destructive confirm). */
export const hapticWarn = (): void =>
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));

/** Outcome feedback — success or error, once, at the moment of truth. */
export const hapticSuccess = (): void =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

export const hapticError = (): void =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
