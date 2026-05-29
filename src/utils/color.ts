const HEX_COLOR = /^#?([0-9a-fA-F]{6})$/;

export function parseHexColor(raw?: string | null): number | null {
  if (!raw?.trim()) return null;
  const match = raw.trim().match(HEX_COLOR);
  if (!match) return null;
  return parseInt(match[1], 16);
}

export function formatHexColor(value?: number): string {
  if (value === undefined || value === null) return "—";
  return `#${value.toString(16).padStart(6, "0").toUpperCase()}`;
}
