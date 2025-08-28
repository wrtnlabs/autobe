import { IAutoBeTokenUsageJson } from "@autobe/interface";

import { COLORS, SHADOWS } from "../constant/color";
import { AutoBeTokenUsage } from "./AutoBeTokenUsage";

interface IAutoBeChatBannerProps {
  tokenUsage: IAutoBeTokenUsageJson | null;
}

export const AutoBeChatBanner = (props: IAutoBeChatBannerProps) => {
  return (
    <header
      style={{
        padding: "0 48",
        position: "sticky",
        top: "12px",
        zIndex: 10,
      }}
    >
      <div
        style={{
          border: `1px solid ${COLORS.GRAY_BORDER}`,
          borderRadius: "8px",
          backgroundColor: COLORS.GRAY_BACKGROUND,
          padding: "16px",
          boxShadow: SHADOWS.CARD,
          width: "100%",
        }}
      >
        <AutoBeTokenUsage tokenUsage={props.tokenUsage} />
      </div>
    </header>
  );
};

export default AutoBeChatBanner;
