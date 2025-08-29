import { IAutoBeTokenUsageJson } from "@autobe/interface";

import { Collapsible } from "../common";
import { COLORS, SHADOWS } from "../constant/color";
import {
  AutoBeAgentInformation,
  IAutoBeAgentInformationProps,
} from "./AutoBeAgentInformation";
import { AutoBeChatState, IAutoBeChatStateProps } from "./AutoBeChatState";
import { AutoBeTokenUsage } from "./AutoBeTokenUsage";

/** Props interface for AutoBeChatBanner component */
interface IAutoBeChatBannerProps {
  /** Agent information to display */
  header: IAutoBeAgentInformationProps["header"];

  /** Token usage data to display */
  tokenUsage: IAutoBeTokenUsageJson | null;

  /** Chat state to display */
  state: IAutoBeChatStateProps["state"];
}

/** Chat banner component with collapsible token usage display */
export const AutoBeChatBanner = (props: IAutoBeChatBannerProps) => {
  return (
    <header
      style={{
        padding: "0 48",
        position: "sticky",
        top: "12px",
        marginBottom: "1rem",
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
          title="Agent Information"
          defaultCollapsed={true}
          animated={true}
        >
          <AutoBeAgentInformation header={props.header} />
        </Collapsible>
        <br />
        <Collapsible
          title="Token Usage"
          defaultCollapsed={false}
          animated={true}
        >
          <AutoBeTokenUsage tokenUsage={props.tokenUsage} />
        </Collapsible>
        <br />
        <Collapsible title="Chat State" defaultCollapsed={true} animated={true}>
          <AutoBeChatState state={props.state} />
        </Collapsible>
      </div>
    </header>
  );
};

export default AutoBeChatBanner;
