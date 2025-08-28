import { IAutoBeTokenUsageJson } from "@autobe/interface";
import { ReactNode } from "react";

import { COLORS } from "../constant/color";
import { toCompactNumberFormat } from "../utils";

/** Props interface for TokenUsageCard component */
interface ITokenUsageCardProps {
  /** Token usage data to display */
  tokenUsage: IAutoBeTokenUsageJson | null;
}

/** Props interface for TokenRow component */
interface ITokenRowProps {
  /** Label text */
  label: string;
  /** Value to display */
  value: ReactNode;
  /** Whether this is the total row with border */
  isTotal?: boolean;
}

/** Props interface for TokenLabel component */
interface ITokenLabelProps {
  /** Label text */
  children: string;
  /** Whether this is a total label */
  isTotal?: boolean;
}

/** Props interface for TokenValue component */
interface ITokenValueProps {
  /** Value content */
  children: ReactNode;
  /** Color variant for the value */
  variant: "input" | "cachedInput" | "output" | "total";
}

/** Token row component with consistent flex layout */
const TokenRow = ({ label, value, isTotal = false }: ITokenRowProps) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      ...(isTotal && {
        paddingTop: "8px",
        borderTop: `1px solid ${COLORS.GRAY_BORDER_LIGHT}`,
      }),
    }}
  >
    <TokenLabel isTotal={isTotal}>{label}</TokenLabel>
    {value}
  </div>
);

/** Token label component with consistent styling */
const TokenLabel = ({ children, isTotal = false }: ITokenLabelProps) => (
  <span
    style={{
      color: isTotal ? COLORS.GRAY_TEXT_DARK : COLORS.GRAY_TEXT_MEDIUM,
      fontWeight: isTotal ? "600" : "500",
    }}
  >
    {children}
  </span>
);

/** Token value component with variant-based styling */
const TokenValue = ({ children, variant }: ITokenValueProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "input":
        return { color: COLORS.TOKEN_INPUT, fontWeight: "600" };
      case "cachedInput":
        return {
          color: COLORS.GRAY_TEXT_MEDIUM,
          fontWeight: "400",
          fontSize: "0.875rem",
        };
      case "output":
        return { color: COLORS.TOKEN_OUTPUT, fontWeight: "600" };
      case "total":
        return {
          color: COLORS.TOKEN_TOTAL,
          fontWeight: "700",
          fontSize: "1.125rem",
        };
      default:
        variant satisfies never;
        return {};
    }
  };

  return <span style={getVariantStyles()}>{children}</span>;
};

/**
 * Token usage card component displaying input, output, and total token counts
 *
 * @param props - Component props
 * @returns JSX element representing the token usage card
 */
export const AutoBeTokenUsage = ({ tokenUsage }: ITokenUsageCardProps) => {
  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <TokenRow
          label="Input:"
          value={
            <TokenValue variant="input">
              {toCompactNumberFormat(tokenUsage?.aggregate.input.total ?? 0)}
            </TokenValue>
          }
        />
        <TokenRow
          label="Cached Input:"
          value={
            <TokenValue variant="cachedInput">
              {toCompactNumberFormat(tokenUsage?.aggregate.input.cached ?? 0)}
            </TokenValue>
          }
        />
        <TokenRow
          label="Output:"
          value={
            <TokenValue variant="output">
              {toCompactNumberFormat(tokenUsage?.aggregate.output.total ?? 0)}
            </TokenValue>
          }
        />
        <TokenRow
          label="Total:"
          value={
            <TokenValue variant="total">
              {toCompactNumberFormat(tokenUsage?.aggregate.total ?? 0)}
            </TokenValue>
          }
          isTotal
        />
      </div>
    </>
  );
};

export default AutoBeTokenUsage;
