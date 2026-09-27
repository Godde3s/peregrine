# Design-law compliance — appllama app-design skill

Peregrine is built against [`Appllama/appllama-skills`](https://github.com/Appllama/appllama-skills)
(MIT). This document maps each governing law to its concrete implementation,
so review can be mechanical instead of vibes-based.

## Native fidelity laws

| # | Law | Where it lives |
|---|-----|----------------|
| 1 | Semantic colors, both themes, day one; never pass semantic objects into Reanimated styles | `lib/theme.ts` resolves one string-token palette per theme; screens consume `useThemeColors()` |
| 2 | Native controls over rebuilt ones | System `Switch`, `@react-native-community/slider`, native `Alert` for destructive confirms, native headers, native search bar |
| 3 | SF Symbols / Material Symbols, never mixed per platform | `components/symbol.tsx` — `expo-symbols` on iOS, mapped Material glyphs on Android, one family per platform |
| 4 | Typography is the hierarchy; tabular numerals for anything that counts | Platform ramp via `lib/theme.ts` (`font.*`); `tabularNums` token on temperature value, latencies, version |
| 5 | Continuous corners on every rounded rectangle | `continuous` token (`borderCurve: 'continuous'`) applied to cards, bubbles, inputs, CTA |
| 6 | Shadows via `boxShadow`, elevation is logic not decoration | `elevation` tokens in `lib/theme.ts` (single system) |
| 7 | 4/8pt spacing rhythm; `gap` over margin stacking; scroll padding in `contentContainerStyle` | `spacing` scale used exclusively; all lists pad via `contentContainerStyle` |
| 8 | Safe areas / home indicator are part of the design | Composer clears the home indicator via pad view; lists use `contentInsetAdjustmentBehavior="automatic"`; no hard-coded notch numbers |
| 9 | Navigation titles belong to the navigator | `Stack.Screen options={{ title }}` everywhere; large-title collapse on all three tabs |
| 10 | Haptics are punctuation — one per action, same frame as the visual | `lib/haptics.ts` — tick (selection), tap (send/snap), warn (delete armed), success/error (outcomes); never on scroll |
| 11 | Numbers formatted like a product | `lib/format.ts` — `1.4M`, `38k`, `312ms`, trimmed zeros, localized dates |
| 12 | Root scroll behavior + `useWindowDimensions` | Overflowing screens wrap in ScrollView/FlashList with automatic inset adjustment; no `Dimensions.get()` in the codebase |

## Navigation laws

| # | Law | Where it lives |
|---|-----|----------------|
| 1 | Push goes deeper, replace moves on | Thread + model detail push; onboarding lands with `router.replace('/(tabs)')` |
| 2 | Presentation is meaning | API key = short interruption → **modal** with its own Cancel/Done; self-contained flows keep their own chrome |
| 3 | One-way doors leave the stack | Root `_layout.tsx` guards with `Stack.Protected`: onboarding is unreachable once configured; Android back from home exits the app |
| 4 | Back is blocked in exactly the two sanctioned cases | Not exercised — no irreversible in-flight requests block back; streaming aborts cleanly instead |
| 5 | Tabs are peers; cold start lands by state | No tab animation; splash is held until settings resolve, so the first frame is already Home or Onboarding — never a flash of the wrong screen |

## Anti-slop laws

| # | Law | Where it lives |
|---|-----|----------------|
| 1 | No AI-default styling (purple-glow CTAs, glassmorphism, mesh heroes, confetti, sparkles) | Flat surfaces, one solid accent, zero decorative gradients in UI chrome |
| 2 | One accent, locked | Peregrine orange (`#E8860C` / `#FF9F0A`) is the only accent on every screen |
| 3 | One grey family | Cool Apple system-grey ramp only |
| 4 | Shape lock, stated as a rule | **Inputs 12 · cards 16 · actions are pills.** No other radii exist (`lib/theme.ts` → `radius`) |
| 5 | No emoji as iconography | SF Symbols / Material only; emoji appear nowhere in chrome |
| 6 | One label per intent | "Start" is the single connect CTA; "Delete" the single destructive verb |
| 7 | Emphasis stays in the family | Weight changes only; no typeface mixing |
| 8 | Full state cycles, not the happy path | Skeletons match final row shape (models), composed empty states (chats, models, thread), inline specific errors with retry (models, bubbles) |
| 9 | Mechanical pre-flight | 1 accent hue · radii ∈ {12, 16, pill} · 0 emoji in chrome · 0 unbranded gradients · 0 duplicate intent labels |

## Motion laws

- **Frequency gate respected**: tab switches and navigation are stock platform transitions (zero custom code — passing the gate with no code is the win).
- **Responsive family**: press states — scale `0.97` on press-*in* (buttons/cards), background highlight on rows (never scale) — `components/pressable.tsx`.
- **Narrative family**: entrances ≤ 220 ms, exits ~0.7×, strong ease-out `bezier(0.23, 1, 0.32, 1)` (`lib/motion.ts`); send button fades in 120 ms.
- **Springs carry velocity**: one vocabulary — `SNAP {400, 1}` / `POP {400, 0.8}` defined once in `lib/motion.ts`.
- **UI thread only**: keyboard tracking via `react-native-keyboard-controller` shared values (`useReanimatedKeyboardAnimation`); press feedback and pulsing dots are worklet-driven; no `runOnJS` in hot paths.
- **Reduce Motion**: press-scale collapses to opacity via `useReducedMotion()`.

## State & performance

- Server state in TanStack Query (models: cache, retry, refetch, pull-to-refresh) — no `useEffect`+`fetch` anywhere.
- Client state in two narrow Zustand stores, persisted to MMKV (sync, tiny).
- Uncontrolled composer input; `hasText` is the only React state in the typing path.
- FlashList for both growable lists; stable keys; no inline closures capturing scope in `renderItem`.
- Optimistic chat: the user's message renders instantly; the assistant placeholder streams into place; failures roll into an inline error state on the bubble.

## Verification status

- `tsc --noEmit` (strict) — clean.
- Simulator pass (light/dark, Dynamic Type XL, keyboard both directions, full-motion screen-record) — pending on contributor hardware; this section is updated as loops complete.
