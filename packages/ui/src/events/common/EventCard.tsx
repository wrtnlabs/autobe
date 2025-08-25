import { ReactNode } from "react";

export interface IEventCardProps {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  variant?: "default" | "success" | "error" | "warning";
}

/**
 * Common event card container component Provides consistent styling across all
 * event components
 */
export const EventCard = (props: IEventCardProps) => {
  const { variant = "default" } = props;

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          boxShadow: "0 1px 3px 0 rgb(34 197 94 / 0.1)",
        };
      case "error":
        return {
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          boxShadow: "0 1px 3px 0 rgb(239 68 68 / 0.1)",
        };
      case "warning":
        return {
          backgroundColor: "#fffbeb",
          border: "1px solid #fed7aa",
          boxShadow: "0 1px 3px 0 rgb(245 158 11 / 0.1)",
        };
      default:
        return {
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
        };
    }
  };

  return (
    <div
      className={props.className}
      style={{
        ...getVariantStyles(),
        borderRadius: "0.75rem",
        padding: "1.5rem",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
};

export default EventCard;
