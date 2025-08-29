/** Color tokens for consistent styling */
export const COLORS = {
  // Gray scale
  GRAY_BORDER: "#d1d5db",
  GRAY_BACKGROUND: "#f9fafb",
  GRAY_BORDER_LIGHT: "#e5e7eb",
  GRAY_TEXT_DARK: "#1f2937",
  GRAY_TEXT_MEDIUM: "#4b5563",

  // Token value colors
  TOKEN_INPUT: "#2563eb", // Blue
  TOKEN_OUTPUT: "#16a34a", // Green
  TOKEN_TOTAL: "#9333ea", // Purple

  // Table colors
  TABLE_BORDER: "#eee",
  TABLE_BORDER_THICK: "#ddd",
  TABLE_HEADER_BG: "#f5f5f5",
} as const;

/** Shadow styles */
export const SHADOWS = {
  CARD: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
} as const;
