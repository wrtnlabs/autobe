import { useState } from "react";

import { useAutoBeAgentSessionList } from "../context/AutoBeAgentSessionList";
import {
  IAutoBeAgentSession,
  IAutoBeAgentSessionStorageStrategy,
} from "../structure";

/** Props interface for AutoBeChatSidebar component */
export interface IAutoBeChatSidebarProps {
  storageStrategy: IAutoBeAgentSessionStorageStrategy;
  /** Whether the sidebar is collapsed (true) or expanded (false) */
  isCollapsed: boolean;
  /** Function to toggle sidebar collapsed/expanded */
  onToggle: () => void;
  /** Custom className */
  className?: string;
  /** Current active session ID */
  activeSessionId?: string;
  /** Function to select a session */
  onSessionSelect: (id: string) => void;
  /** Function to delete a session */
  onDeleteSession: (id: string) => void;
}

/** Beautiful and modern chat sidebar component as part of layout */
export const AutoBeChatSidebar = (props: IAutoBeChatSidebarProps) => {
  const { sessionList } = useAutoBeAgentSessionList();
  const collapsedWidth = "60px";
  const expandedWidth = "320px";
  return (
    <div
      className={props.className}
      style={{
        position: "relative",
        height: "100%",
        width: props.isCollapsed ? collapsedWidth : expandedWidth,
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
          padding: props.isCollapsed ? "1rem 0.75rem" : "1.5rem 1.25rem 1rem",
          borderBottom: "1px solid #f3f4f6",
          backgroundColor: "#fafafa",
          transition: "padding 0.3s ease",
        }}
      >
        {/* Toggle button and title */}
        <div
          style={{
            display: "flex",
            justifyContent: props.isCollapsed ? "center" : "space-between",
            alignItems: "center",
            marginBottom: props.isCollapsed ? "0" : "1rem",
            transition: "all 0.3s ease",
          }}
        >
          {!props.isCollapsed && (
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#1f2937",
                margin: 0,
                opacity: props.isCollapsed ? 0 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              Chat History
            </h2>
          )}
          <button
            onClick={props.onToggle}
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
            title={props.isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
                transform: props.isCollapsed
                  ? "rotate(0deg)"
                  : "rotate(180deg)",
                transition: "transform 0.3s ease",
              }}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conversations list */}
      <div
        style={{
          flex: 1,
          overflowY: props.isCollapsed ? "visible" : "auto",
          padding: props.isCollapsed ? "0.25rem" : "0.5rem",
          transition: "padding 0.3s ease",
        }}
      >
        {props.isCollapsed ? (
          // Collapsed state - show compact conversation indicators
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {sessionList.slice(0, 8).map((session) => (
              <div
                key={session.id}
                onClick={() => props.onSessionSelect?.(session.id)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "0.5rem",
                  backgroundColor:
                    props.activeSessionId === session.id
                      ? "#3b82f6"
                      : "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  margin: "0 auto",
                  color:
                    props.activeSessionId === session.id
                      ? "#ffffff"
                      : "#6b7280",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
                onMouseEnter={(e) => {
                  if (props.activeSessionId !== session.id) {
                    e.currentTarget.style.backgroundColor = "#e5e7eb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (props.activeSessionId !== session.id) {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }
                }}
                title={session.title}
              >
                {session.title.charAt(0).toUpperCase()}
              </div>
            ))}
            {sessionList.length > 8 && (
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "0.5rem",
                  backgroundColor: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  color: "#6b7280",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                }}
              >
                +{sessionList.length - 8}
              </div>
            )}
          </div>
        ) : (
          // Expanded state - show full conversation list
          <>
            {sessionList.length === 0 ? (
              <div
                style={{
                  padding: "2rem 1rem",
                  textAlign: "center",
                  color: "#6b7280",
                  fontSize: "0.875rem",
                }}
              >
                <div style={{ marginBottom: "0.5rem" }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ margin: "0 auto", opacity: 0.5 }}
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p style={{ margin: 0 }}>No conversations yet</p>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem" }}>
                  Start a new chat to see your history here
                </p>
              </div>
            ) : (
              sessionList.map((session) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  isActive={props.activeSessionId === session.id}
                  onSelect={(sessionId: string) =>
                    props.onSessionSelect?.(sessionId)
                  }
                  onDelete={props.onDeleteSession}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AutoBeChatSidebar;

/** Props for ConversationListItem component */
export interface IConversationListItemProps {
  /** Conversation session data */
  session: IAutoBeAgentSession;
  /** Whether this conversation is currently active */
  isActive: boolean;
  /** Callback when conversation is selected */
  onSelect: (sessionId: string) => void;
  /** Callback when conversation should be deleted */
  onDelete: (sessionId: string) => void;
}

/**
 * Individual conversation list item component Displays conversation title,
 * metadata, and actions
 */
export const SessionListItem = (props: IConversationListItemProps) => {
  const { session, isActive, onSelect, onDelete } = props;
  const [isHovered, setIsHovered] = useState(false);
  const lastMessage = session.history.at(-1);
  return (
    <div
      style={{
        marginBottom: "0.5rem",
        borderRadius: "0.75rem",
        padding: "0.75rem",
        cursor: "pointer",
        backgroundColor: isActive
          ? "#eff6ff"
          : isHovered
            ? "#f9fafb"
            : "transparent",
        border: isActive ? "1px solid #dbeafe" : "1px solid transparent",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        position: "relative",
      }}
      onClick={() => onSelect(session.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Conversation title */}
      <div
        style={{
          fontSize: "0.875rem",
          fontWeight: "500",
          color: isActive ? "#1d4ed8" : "#1f2937",
          lineHeight: "1.25",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {session.title ?? "Untitled"}
      </div>

      {/* Conversation metadata */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.75rem",
          color: "#6b7280",
        }}
      >
        <span>
          {session.history.length > 0 && lastMessage !== undefined
            ? new Date(lastMessage.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "No messages"}
        </span>
        {session.history.length > 0 && (
          <span>{session.history.length} messages</span>
        )}
      </div>

      {/* Delete button - always visible with X icon */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log(session);
            onDelete(session.id);
          }}
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            background: "rgba(0, 0, 0, 0.05)",
            border: "none",
            borderRadius: "50%",
            width: "1.25rem",
            height: "1.25rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            transition: "all 0.2s ease",
            opacity: isHovered ? 1 : 0.7,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#fee2e2";
            e.currentTarget.style.color = "#dc2626";
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
            e.currentTarget.style.color = "#6b7280";
            e.currentTarget.style.opacity = isHovered ? "1" : "0.7";
          }}
          title="Delete conversation"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
