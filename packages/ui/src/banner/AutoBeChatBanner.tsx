import { useState } from "react";

import { Collapsible } from "../common";
import { COLORS, SHADOWS } from "../constant/color";
import { ReceiptIcon } from "../icons/Receipt";
import { AutoBeAgentInformation } from "./AutoBeAgentInformation";
import { AutoBeChatState } from "./AutoBeChatState";

/** Chat banner component with collapsible token usage display */
export const AutoBeChatBanner = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isReceiptHovered, setIsReceiptHovered] = useState(false);
  const [isCloseHovered, setIsCloseHovered] = useState(false);

  const toggleBanner = () => {
    setIsCollapsed(!isCollapsed);
  };

  const closeBanner = () => {
    setIsCollapsed(true);
  };

  if (isCollapsed) {
    return (
      <div
        style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "2rem",
          cursor: "pointer",
          display: "flex",
          zIndex: 1001,
          color: COLORS.GRAY_TEXT_DARK,
          transition: "all 0.2s ease",
          flexDirection: "row",
        }}
        onClick={toggleBanner}
        onMouseEnter={() => setIsReceiptHovered(true)}
        onMouseLeave={() => setIsReceiptHovered(false)}
      >
        <div style={{ flex: 1 }}></div>
        <div
          style={{
            marginTop: "20px",
            width: "2rem",
            height: "2rem",
            marginRight: "12px",
            backgroundColor: "white",
            borderRadius: "33%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isReceiptHovered ? SHADOWS.BUTTON_HOVER : SHADOWS.BUTTON,
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: `1px solid ${COLORS.GRAY_BORDER}`,
          }}
        >
          <ReceiptIcon
            width={24}
            height={24}
            color={
              isReceiptHovered ? COLORS.GRAY_TEXT_DARK : COLORS.GRAY_TEXT_MEDIUM
            }
          />
        </div>
      </div>
    );
  }

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
          position: "relative",
          border: `1px solid ${COLORS.GRAY_BORDER}`,
          borderRadius: "8px",
          backgroundColor: COLORS.GRAY_BACKGROUND,
          padding: "0 16px 16px 16px",
          boxShadow: SHADOWS.STRONG,
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* X Button */}
        <button
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            width: "24px",
            height: "24px",
            border: "none",
            backgroundColor: isCloseHovered
              ? COLORS.GRAY_BORDER_LIGHT
              : "transparent",
            cursor: "pointer",
            fontSize: "18px",
            color: isCloseHovered
              ? COLORS.GRAY_TEXT_DARK
              : COLORS.GRAY_TEXT_MEDIUM,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            transition: "all 0.2s ease",
          }}
          onClick={closeBanner}
          onMouseEnter={() => setIsCloseHovered(true)}
          onMouseLeave={() => setIsCloseHovered(false)}
          title="hide summary"
        >
          ✕
        </button>

        <h3 style={{ margin: "16px 0" }}>Summaries</h3>
        <Collapsible
          title="Agent Information"
          defaultCollapsed={true}
          animated={true}
        >
          <AutoBeAgentInformation />
        </Collapsible>
        <Collapsible title="Chat State" defaultCollapsed={true} animated={true}>
          <AutoBeChatState />
        </Collapsible>
      </div>
    </header>
  );
};

export default AutoBeChatBanner;
