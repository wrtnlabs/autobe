import { useCallback, useEffect, useState } from "react";

import { useAutoBeAgentSessionList } from "../context/AutoBeAgentSessionList";
import { useSearchParams } from "../context/SearchParamsContext";
import {
  IAutoBeAgentSession,
  IAutoBeAgentSessionStorageStrategy,
} from "../structure";
import { ActionButtonGroup } from "./common/ActionButtonGroup";
import { CompactSessionList } from "./common/CompactSessionList";

/** Props interface for AutoBeChatSidebar component */
export interface IAutoBeChatSidebarProps {
  storageStrategy: IAutoBeAgentSessionStorageStrategy;
  /** Whether the sidebar is collapsed (true) or expanded (false) */
  isCollapsed: boolean;
  /** Function to toggle sidebar collapsed/expanded */
  onToggle: () => void;
  /** Custom className */
  className?: string;
  /** Function to select a session */
  onSessionSelect?: (id: string) => Promise<void> | void;
  /** Function to delete a session */
  onDeleteSession?: (id: string) => Promise<void> | void;
}

const collapsedWidth = "60px";
const expandedWidth = "320px";
/** Beautiful and modern chat sidebar component as part of layout */
export const AutoBeChatSidebar = (props: IAutoBeChatSidebarProps) => {
  const { sessionList, refreshSessionList } = useAutoBeAgentSessionList();
  const { searchParams, setSearchParams } = useSearchParams();
  const activeSessionId = searchParams.get("session-id") ?? null;
  const [currentSessionId, setCurrentSessionId] = useState(
    Array.isArray(activeSessionId) ? activeSessionId.at(0) : activeSessionId,
  );

  const handleOnSessionSelect = useCallback(
    (sessionId: string) => {
      props.onSessionSelect?.(sessionId);
      setSearchParams((sp) => {
        const newSp = new URLSearchParams(sp);
        newSp.set("session-id", sessionId);
        return newSp;
      });
      setCurrentSessionId(sessionId);
    },
    [props.onSessionSelect, setSearchParams],
  );

  useEffect(() => {
    setCurrentSessionId(activeSessionId);
  }, [searchParams]);

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
          <CompactSessionList
            sessions={sessionList}
            activeSessionId={currentSessionId}
            maxItems={8}
            onSessionSelect={handleOnSessionSelect}
          />
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
                  isActive={currentSessionId === session.id}
                  onSelect={handleOnSessionSelect}
                  onDelete={async () => {
                    await props.onDeleteSession?.(session.id);
                    refreshSessionList();
                    if (session.id === currentSessionId) {
                      setSearchParams((sp) => {
                        const newSp = new URLSearchParams(sp);
                        newSp.delete("session-id");
                        return newSp;
                      });
                    }
                  }}
                  onEditTitle={async (_: string, newTitle: string) => {
                    // Update the session title through storage strategy
                    await props.storageStrategy.editSessionTitle({
                      id: session.id,
                      title: newTitle,
                    });
                    refreshSessionList();
                  }}
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
  /** Callback when conversation should be edited */
  onEditTitle: (sessionId: string, title: string) => void;
}

/**
 * Individual conversation list item component Displays conversation title,
 * metadata, and actions
 */
export const SessionListItem = (props: IConversationListItemProps) => {
  const { session, isActive, onSelect, onDelete, onEditTitle } = props;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(session.title ?? "");
  const lastMessage = session.history.at(-1);

  //----
  // EVENT HANDLERS
  //----
  const handleStartEditing = () => {
    setIsEditing(true);
    setEditingTitle(session.title ?? "Untitled");
  };

  const handleSaveTitle = () => {
    const trimmedTitle = editingTitle.trim();
    if (trimmedTitle && trimmedTitle !== session.title) {
      onEditTitle?.(session.id, trimmedTitle);
    }
    setIsEditing(false);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditingTitle(session.title ?? "Untitled");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelEditing();
    }
  };

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
      {/* Conversation title and action buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          fontSize: "0.875rem",
          fontWeight: "500",
          color: isActive ? "#1d4ed8" : "#1f2937",
          lineHeight: "1.25",
          paddingRight: "0.5rem", // Space for buttons
        }}
      >
        {/* Title section */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            minWidth: 0, // Allow shrinking
          }}
        >
          {isEditing ? (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSaveTitle}
              style={{
                flex: 1,
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem",
                padding: "0.25rem 0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: isActive ? "#1d4ed8" : "#1f2937",
                backgroundColor: "#ffffff",
                outline: "none",
                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.25)",
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {session.title ?? "Untitled"}
            </span>
          )}
        </div>

        {/* Action buttons group */}
        {!isEditing ? (
          <div
            style={{
              visibility: isHovered ? "visible" : "hidden",
              opacity: isHovered ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          >
            <ActionButtonGroup
              onEdit={handleStartEditing}
              onDelete={onDelete ? () => onDelete(session.id) : undefined}
            />
          </div>
        ) : (
          <ActionButtonGroup
            onSave={handleSaveTitle}
            onCancel={handleCancelEditing}
          />
        )}
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
    </div>
  );
};
