import { IAutoBeTokenUsageJson } from "@autobe/interface";

import { Collapsible } from "../common";
import { COLORS, SHADOWS } from "../constant/color";
import { AutoBeTokenUsage } from "./AutoBeTokenUsage";

/** Props interface for AutoBeChatBanner component */
interface IAutoBeChatBannerProps {
  /** Token usage data to display */
  tokenUsage: IAutoBeTokenUsageJson | null;
}

/** Chat banner component with collapsible token usage display */
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
          padding: "0 16px 16px 16px",
          boxShadow: SHADOWS.CARD,
          width: "100%",
        }}
      >
        <h3>Summaries</h3>

        <Collapsible
          title="Token Usage"
          defaultCollapsed={false}
          animated={true}
        >
          <AutoBeTokenUsage tokenUsage={props.tokenUsage} />
        </Collapsible>
      </div>
    </header>
  );
};

export default AutoBeChatBanner;
