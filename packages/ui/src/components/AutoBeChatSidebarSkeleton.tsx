import React from "react";

/** Props interface for AutoBeChatSidebarSkeleton component */
export interface IAutoBeChatSidebarSkeletonProps {
  /** Whether the sidebar is collapsed (true) or expanded (false) */
  isCollapsed: boolean;
  /** Function to toggle sidebar collapsed/expanded */
  onToggle: () => void;
  /** Custom className */
  className?: string;
  /** Number of skeleton conversation items to show */
  skeletonCount?: number;
}

/**
 * Skeleton component for chat sidebar during loading states Mimics the
 * structure and styling of AutoBeChatSidebar
 */
export const AutoBeChatSidebarSkeleton = (
  props: IAutoBeChatSidebarSkeletonProps,
) => {
  const { isCollapsed, onToggle, className, skeletonCount = 8 } = props;
  const collapsedWidth = "60px";
  const expandedWidth = "320px";

  /** Enhanced skeleton shimmer animation keyframes */
  const shimmerKeyframes = `
    @keyframes shimmer {
      0% {
        background-position: -200px 0;
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
      100% {
        background-position: calc(200px + 100%) 0;
        opacity: 1;
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.4;
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  /** Enhanced skeleton base style with improved shimmer animation */
  const skeletonBaseStyle: React.CSSProperties = {
    background: "linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%)",
    backgroundSize: "200px 100%",
    animation: "shimmer 2s infinite ease-in-out",
    borderRadius: "0.5rem",
    position: "relative",
    overflow: "hidden",
  };

  /** Pulsing skeleton style for interactive elements */
  const skeletonPulseStyle: React.CSSProperties = {
    background: "#f1f3f4",
    animation: "pulse 2s infinite ease-in-out",
    borderRadius: "0.5rem",
  };

  return (
    <>
      {/* Inject keyframes */}
      <style>{shimmerKeyframes}</style>

      {/* Sidebar container */}
      <div
        className={className}
        style={{
          position: "relative",
          height: "100%",
          width: isCollapsed ? collapsedWidth : expandedWidth,
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          boxShadow: "2px 0 4px rgba(0, 0, 0, 0.05)",
          transition: "width 0.3s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Header section */}
        <div
          style={{
            padding: isCollapsed ? "1rem 0.75rem" : "1.5rem 1.25rem 1rem",
            borderBottom: "1px solid #f3f4f6",
            backgroundColor: "#fafafa",
            transition: "padding 0.3s ease",
          }}
        >
          {/* Toggle button and title */}
          <div
            style={{
              display: "flex",
              justifyContent: isCollapsed ? "center" : "space-between",
              alignItems: "center",
              marginBottom: isCollapsed ? "0" : "1rem",
              transition: "all 0.3s ease",
            }}
          >
            {/* Title skeleton */}
            {!isCollapsed && (
              <div
                style={{
                  ...skeletonBaseStyle,
                  height: "1.5rem",
                  width: "8rem",
                }}
              />
            )}

            {/* Toggle button */}
            <button
              onClick={onToggle}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
                borderRadius: "0.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conversations list skeleton */}
        <div
          style={{
            flex: 1,
            overflowY: isCollapsed ? "visible" : "auto",
            padding: isCollapsed ? "0.25rem" : "0.5rem",
            transition: "padding 0.3s ease",
          }}
        >
          {isCollapsed ? (
            // Collapsed state - show enhanced compact skeleton circles
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                animation: "fadeIn 0.5s ease-out",
              }}
            >
              {Array.from(
                { length: Math.min(skeletonCount, 8) },
                (_, index) => (
                  <div
                    key={index}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      margin: "0 auto",
                      background: `linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)`,
                      backgroundSize: "200% 200%",
                      animation: `shimmer 2s infinite ease-in-out ${index * 0.2}s`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Add subtle inner glow effect */}
                    <div
                      style={{
                        position: "absolute",
                        top: "20%",
                        left: "20%",
                        right: "20%",
                        bottom: "20%",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.8)",
                        ...skeletonPulseStyle,
                      }}
                    />
                  </div>
                ),
              )}
            </div>
          ) : (
            // Expanded state - show enhanced full skeleton items
            <div style={{ animation: "fadeIn 0.5s ease-out" }}>
              {Array.from({ length: skeletonCount }, (_, index) => (
                <ConversationSkeletonItem
                  key={index}
                  index={index}
                  delay={index * 0.1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Enhanced individual conversation skeleton item with staggered animations
 * Mimics the structure of ConversationListItem with more realistic variations
 */
const ConversationSkeletonItem = ({
  index,
  delay = 0,
}: {
  index?: number;
  delay?: number;
}) => {
  const skeletonBaseStyle: React.CSSProperties = {
    background: "linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%)",
    backgroundSize: "200px 100%",
    animation: `shimmer 2s infinite ease-in-out ${delay}s`,
    borderRadius: "0.5rem",
    position: "relative",
    overflow: "hidden",
  };

  // Generate more realistic random widths based on conversation patterns
  const titleWidths = ["85%", "72%", "91%", "78%", "88%", "69%", "94%", "76%"];
  const titleWidth = titleWidths[index ? index % titleWidths.length : 0];

  return (
    <div
      style={{
        marginBottom: "0.5rem",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        border: "1px solid transparent",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        position: "relative",
        animation: `fadeIn 0.5s ease-out ${delay}s both`,
        backgroundColor: "rgba(248, 249, 250, 0.3)",
        transition: "all 0.2s ease",
      }}
    >
      {/* Avatar circle - simulating conversation icon */}
      <div
        style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}
      >
        <div
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #f1f3f4 0%, #e8eaed 100%)",
            animation: `pulse 2s infinite ease-in-out ${delay + 0.5}s`,
            flexShrink: 0,
          }}
        />

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {/* Title skeleton with more realistic variation */}
          <div
            style={{
              ...skeletonBaseStyle,
              height: "1rem",
              width: titleWidth,
              position: "relative",
            }}
          >
            {/* Subtle highlight sweep */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "-100%",
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                animation: `shimmer 3s infinite ease-in-out ${delay}s`,
              }}
            />
          </div>

          {/* Metadata skeleton */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Date skeleton with realistic format */}
            <div
              style={{
                ...skeletonBaseStyle,
                height: "0.75rem",
                width: "4.5rem", // Slightly wider for Korean date format
                animation: `shimmer 2s infinite ease-in-out ${delay + 0.2}s`,
              }}
            />
            {/* Message count skeleton */}
            <div
              style={{
                ...skeletonBaseStyle,
                height: "0.75rem",
                width: "3.2rem", // "12 messages" size
                animation: `shimmer 2s infinite ease-in-out ${delay + 0.4}s`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Subtle border effect */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "0.75rem",
          background:
            "linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.02) 50%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default AutoBeChatSidebarSkeleton;
