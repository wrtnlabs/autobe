import { IAutoBePlaygroundSession } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import {
  IAutoBeAgentSessionStorageStrategy,
  useAutoBeAgentSessionList,
  useSearchParams,
} from "@autobe/ui";
import { ChevronLeft, ChevronRight, Delete } from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { getConnection } from "../../utils/connection";

export const AutoBePlaygroundSidebar = (
  props: AutoBePlaygroundSidebar.IProps,
) => {
  const theme = useTheme();
  const { refreshSessionList } = useAutoBeAgentSessionList();
  const { searchParams } = useSearchParams();
  const activeSessionId = searchParams.get("session-id") ?? null;

  const [sessions, setSessions] = useState<
    IAutoBePlaygroundSession.ISummary[] | null
  >(null);

  const loadSessions = useCallback(async () => {
    try {
      const page = await pApi.functional.autobe.playground.sessions.index(
        getConnection(),
        { limit: 100 },
      );
      setSessions(page.data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleSessionSelect = (id: string) => {
    window.location.href = `/?session-id=${id}`;
  };

  const handleSessionDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await props.storageStrategy.deleteSession({ id });
    await loadSessions();
    refreshSessionList();
  };

  const width = props.isCollapsed ? 48 : 300;

  return (
    <Box
      sx={{
        width,
        minWidth: width,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Toggle */}
      <Box
        sx={{
          display: "flex",
          justifyContent: props.isCollapsed ? "center" : "flex-end",
          p: 0.5,
        }}
      >
        <IconButton size="small" onClick={props.onToggle}>
          {props.isCollapsed ? (
            <ChevronRight fontSize="small" />
          ) : (
            <ChevronLeft fontSize="small" />
          )}
        </IconButton>
      </Box>

      {!props.isCollapsed && (
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <SessionsPanel
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={handleSessionSelect}
            onDelete={handleSessionDelete}
          />
        </Box>
      )}
    </Box>
  );
};

export namespace AutoBePlaygroundSidebar {
  export interface IProps {
    storageStrategy: IAutoBeAgentSessionStorageStrategy;
    isCollapsed: boolean;
    onToggle: () => void;
  }
}

/* ------------------------------------------------------------------ */
/*  Sessions Panel                                                     */
/* ------------------------------------------------------------------ */
const SessionsPanel = (props: {
  sessions: IAutoBePlaygroundSession.ISummary[] | null;
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}) => {
  const theme = useTheme();

  if (props.sessions === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (props.sessions.length === 0) {
    return (
      <Typography
        variant="body2"
        sx={{ textAlign: "center", color: "text.secondary", py: 4 }}
      >
        No sessions yet
      </Typography>
    );
  }

  return (
    <List dense disablePadding>
      {props.sessions.map((s) => {
        const isActive = s.id === props.activeSessionId;
        const title = s.title ?? s.model;
        const date = new Date(s.created_at);

        return (
          <ListItemButton
            key={s.id}
            selected={isActive}
            onClick={() => props.onSelect(s.id)}
            sx={{
              py: 1,
              px: 1.5,
              "&.Mui-selected": {
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <ListItemText
              primary={
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ fontWeight: isActive ? 600 : 400, fontSize: "0.82rem" }}
                >
                  {title}
                </Typography>
              }
              secondary={
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                  sx={{ mt: 0.25 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {date.toLocaleDateString()}
                  </Typography>
                  {s.phase && (
                    <Chip
                      label={s.phase}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: "0.65rem",
                        textTransform: "capitalize",
                      }}
                    />
                  )}
                  {s.completed_at && (
                    <Chip
                      label="Done"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ height: 16, fontSize: "0.65rem" }}
                    />
                  )}
                </Stack>
              }
            />
            <IconButton
              size="small"
              onClick={(e) => props.onDelete(e, s.id)}
              sx={{
                opacity: 0.3,
                "&:hover": { opacity: 1, color: theme.palette.error.main },
              }}
            >
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </ListItemButton>
        );
      })}
    </List>
  );
};
