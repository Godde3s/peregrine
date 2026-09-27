/**
 * Format numbers like a product, not a database (fidelity law 11):
 * 1.4M, 38k, 312 ms. Trim trailing zeros. Localize dates.
 */

export function compactNumber(n: number): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (abs >= 1_000) return `${trim(n / 1_000)}k`;
  return String(Math.round(n));
}

function trim(value: number): string {
  return value.toFixed(value >= 100 ? 0 : 1).replace(/\.0$/, '');
}

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${trim(ms / 1000)}s`;
}

export function formatTokens(n: number): string {
  return compactNumber(n);
}

/** "14:32", "Yesterday", "Sep 21" — short, localized, no noise. */
export function formatTimestamp(epochMs: number): string {
  const date = new Date(epochMs);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (sameDay) {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  }).format(date);
}

export function formatDate(epochSec: number | undefined): string {
  if (!epochSec) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(epochSec * 1000));
}

/** "claude-sonnet-4-5" → "Claude Sonnet 4 5" — for headers, not for ids. */
export function prettifyModelId(id: string): string {
  return id
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) =>
      /^\d/.test(part) || part.length <= 2
        ? part.toUpperCase().slice(0, 4) === part
          ? part.toUpperCase()
          : part
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(' ');
}
