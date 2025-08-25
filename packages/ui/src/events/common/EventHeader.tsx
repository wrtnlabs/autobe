import { ReactNode } from "react";

import { formatTime } from "../../utils/time";
import { EventIcon, EventIconType } from "./EventIcon";

export interface IEventHeaderProps {
  title: string;
  subtitle?: ReactNode;
  timestamp: string;
  iconType: EventIconType;
  step?: number;
}

/**
 * Common event header component Provides consistent header layout with icon,
 * title, and timestamp
 */
export const EventHeader = (props: IEventHeaderProps) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <EventIcon type={props.iconType} />

        <div>
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#1e293b",
              margin: 0,
              marginBottom: "0.25rem",
            }}
          >
            {props.title}
          </h3>
          {props.subtitle && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              {props.subtitle}
            </div>
          )}
          {props.step !== undefined && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >
              Step #{props.step}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          fontSize: "0.75rem",
          color: "#64748b",
          textAlign: "right",
        }}
      >
        {formatTime(props.timestamp)}
      </div>
    </div>
  );
};

export default EventHeader;
