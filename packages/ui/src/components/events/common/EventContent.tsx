import { ReactNode } from "react";

export interface IEventContentProps {
  children: ReactNode;
  style?: React.CSSProperties;
}

/**
 * Common event content component Provides consistent content area styling
 * across all event components
 */
export const EventContent = (props: IEventContentProps) => {
  return (
    <div
      style={{
        fontSize: "0.875rem",
        lineHeight: "1.5",
        color: "#475569",
        backgroundColor: "#ffffff",
        padding: "1rem",
        borderRadius: "0.5rem",
        border: "1px solid #e2e8f0",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
};

export default EventContent;
