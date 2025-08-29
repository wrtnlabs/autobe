import {
  IAutoBePlaygroundHeader,
  IAutoBePlaygroundVendor,
} from "@autobe/interface";
import { ILlmSchema } from "@samchon/openapi";
import { ReactNode } from "react";

import { COLORS } from "../constant/color";

export interface IAutoBeAgentInformationProps {
  header: Omit<IAutoBePlaygroundHeader<ILlmSchema.Model>, "vendor"> & {
    vendor: Omit<IAutoBePlaygroundVendor, "apiKey">;
  };
}

/** Props interface for InfoRow component */
interface IInfoRowProps {
  /** Label text */
  label: string;
  /** Value to display */
  value: ReactNode;
}

/** Props interface for InfoLabel component */
interface IInfoLabelProps {
  /** Label text */
  children: string;
}

/** Props interface for InfoValue component */
interface IInfoValueProps {
  /** Value content */
  children: ReactNode;
}

/** Info row component with consistent flex layout */
const InfoRow = ({ label, value }: IInfoRowProps) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      padding: "4px 0",
      gap: "8px",
    }}
  >
    <InfoLabel>{label + ":"}</InfoLabel>
    <InfoValue>{value}</InfoValue>
  </div>
);

/** Info label component with consistent styling */
const InfoLabel = ({ children }: IInfoLabelProps) => (
  <span
    style={{
      color: COLORS.GRAY_TEXT_MEDIUM,
      fontWeight: "500",
      fontSize: "0.875rem",
    }}
  >
    {children}
  </span>
);

/** Info value component with styling */
const InfoValue = ({ children }: IInfoValueProps) => (
  <span
    style={{
      color: COLORS.GRAY_TEXT_DARK,
      fontWeight: "600",
      fontSize: "0.875rem",
    }}
  >
    {children}
  </span>
);

/**
 * Agent information component displaying model, locale, and configuration
 * details
 *
 * @param props - Component props
 * @returns JSX element representing the agent information
 */
export const AutoBeAgentInformation = ({
  header,
}: IAutoBeAgentInformationProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <InfoRow label="AI Model" value={header.vendor.model} />
      <InfoRow label="Schema Model" value={header.model} />
      <InfoRow label="Locale" value={header.locale} />
      <InfoRow label="Timezone" value={header.timezone} />
      <InfoRow label="Semaphore" value={header.vendor.semaphore ?? 16} />
    </div>
  );
};
