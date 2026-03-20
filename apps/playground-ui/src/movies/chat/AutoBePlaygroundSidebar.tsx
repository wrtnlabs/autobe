import {
  IAutoBePlaygroundExample,
  IAutoBePlaygroundSession,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import {
  IAutoBeAgentSessionStorageStrategy,
  useAutoBeAgentSessionList,
  useSearchParams,
} from "@autobe/ui";
import {
  ChevronLeft,
  ChevronRight,
  Delete,
  PlayArrow,
  Science,
  Storage,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Tooltip,
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

  const [tab, setTab] = useState(0);

  // Sessions
  const [sessions, setSessions] = useState<
    IAutoBePlaygroundSession.ISummary[] | null
  >(null);

  // Examples
  const [examples, setExamples] = useState<IAutoBePlaygroundExample[] | null>(
    null,
  );

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

  const loadExamples = useCallback(async () => {
    try {
      const list = await pApi.functional.autobe.playground.examples.index(
        getConnection(),
      );
      setExamples(list);
    } catch (err) {
      console.error("Failed to load examples:", err);
      setExamples([]);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadExamples();
  }, [loadSessions, loadExamples]);

  const handleSessionSelect = (id: string) => {
    window.location.href = `/?session-id=${id}`;
  };

  const handleSessionDelete = async (
    e: React.MouseEvent,
    id: string,
  ) => {
    e.stopPropagation();
    await props.storageStrategy.deleteSession({ id });
    await loadSessions();
    refreshSessionList();
  };

  const handleExampleClick = async (ex: IAutoBePlaygroundExample) => {
    try {
      const session =
        await pApi.functional.autobe.playground.sessions.create(
          getConnection(),
          { mock: { vendor: ex.vendor, project: ex.project } },
        );
      window.location.href = `/?session-id=${session.id}`;
    } catch (err) {
      console.error("Failed to create mock session:", err);
    }
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

      {props.isCollapsed ? (
        /* Collapsed: icon indicators */
        <Stack spacing={0.5} alignItems="center" sx={{ px: 0.5 }}>
          <Tooltip title="Sessions" placement="right">
            <IconButton
              size="small"
              color={tab === 0 ? "primary" : "default"}
              onClick={() => {
                setTab(0);
                props.onToggle();
              }}
            >
              <Storage fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Examples" placement="right">
            <IconButton
              size="small"
              color={tab === 1 ? "primary" : "default"}
              onClick={() => {
                setTab(1);
                props.onToggle();
              }}
            >
              <Science fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ) : (
        <>
          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              minHeight: 36,
              "& .MuiTab-root": { minHeight: 36, py: 0.5, fontSize: "0.8rem" },
            }}
          >
            <Tab
              icon={<Storage sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="Sessions"
            />
            <Tab
              icon={<Science sx={{ fontSize: 16 }} />}
              iconPosition="start"
              label="Examples"
            />
          </Tabs>
          <Divider />

          {/* Content */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {tab === 0 && (
              <SessionsPanel
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelect={handleSessionSelect}
                onDelete={handleSessionDelete}
              />
            )}
            {tab === 1 && (
              <ExamplesPanel
                examples={examples}
                onClick={handleExampleClick}
              />
            )}
          </Box>
        </>
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

/* ------------------------------------------------------------------ */
/*  Examples Panel                                                     */
/* ------------------------------------------------------------------ */
const ExamplesPanel = (props: {
  examples: IAutoBePlaygroundExample[] | null;
  onClick: (ex: IAutoBePlaygroundExample) => void;
}) => {
  const theme = useTheme();

  if (props.examples === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (props.examples.length === 0) {
    return (
      <Typography
        variant="body2"
        sx={{ textAlign: "center", color: "text.secondary", py: 4 }}
      >
        No examples available
      </Typography>
    );
  }

  // Group by vendor
  const byVendor = props.examples.reduce(
    (acc, ex) => {
      (acc[ex.vendor] ??= []).push(ex);
      return acc;
    },
    {} as Record<string, IAutoBePlaygroundExample[]>,
  );

  return (
    <Box sx={{ py: 0.5 }}>
      {Object.entries(byVendor).map(([vendor, items]) => (
        <Box key={vendor}>
          <Typography
            variant="caption"
            sx={{
              px: 1.5,
              py: 0.5,
              display: "block",
              fontWeight: 600,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontSize: "0.65rem",
            }}
          >
            {vendor}
          </Typography>
          <List dense disablePadding>
            {items.map((ex) => (
              <ListItemButton
                key={`${ex.vendor}/${ex.project}`}
                onClick={() => props.onClick(ex)}
                sx={{ py: 0.75, px: 1.5 }}
              >
                <PlayArrow
                  sx={{
                    fontSize: 16,
                    mr: 1,
                    color: theme.palette.primary.main,
                  }}
                />
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "0.82rem", fontWeight: 500 }}
                    >
                      {ex.project}
                    </Typography>
                  }
                  secondary={
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ mt: 0.25, flexWrap: "wrap", gap: 0.25 }}
                    >
                      {ex.phases.map((phase) => (
                        <Chip
                          key={phase}
                          label={phase}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 16,
                            fontSize: "0.6rem",
                            textTransform: "capitalize",
                          }}
                        />
                      ))}
                    </Stack>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );
};
