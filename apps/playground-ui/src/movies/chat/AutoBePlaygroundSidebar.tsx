import {
  IAutoBePlaygroundSession,
  IAutoBePlaygroundVendor,
  IAutoBePlaygroundVendorModel,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import {
  IAutoBeAgentSessionStorageStrategy,
  useAutoBeAgentSessionList,
  useSearchParams,
} from "@autobe/ui";
import { Add, ChevronLeft, ChevronRight, Delete } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
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
  const { sessionList, refreshSessionList } = useAutoBeAgentSessionList();
  const { searchParams, setSearchParams } = useSearchParams();
  const activeSessionId = searchParams.get("session-id") ?? null;

  const [sessions, setSessions] = useState<
    IAutoBePlaygroundSession.ISummary[] | null
  >(null);

  // Filter state
  const [filterVendorId, setFilterVendorId] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState<string | null>(null);
  const [vendors, setVendors] = useState<IAutoBePlaygroundVendor[]>([]);
  const [vendorModels, setVendorModels] = useState<
    IAutoBePlaygroundVendorModel[]
  >([]);

  // Load vendors for filter dropdown
  useEffect(() => {
    pApi.functional.autobe.playground.vendors
      .index(getConnection(), {})
      .then((page) => setVendors(page.data))
      .catch(console.error);
  }, []);

  // Load models for selected vendor filter
  useEffect(() => {
    if (!filterVendorId) {
      setVendorModels([]);
      return;
    }
    pApi.functional.autobe.playground.vendors.models
      .index(getConnection(), filterVendorId)
      .then(setVendorModels)
      .catch(console.error);
  }, [filterVendorId]);

  const loadSessions = useCallback(async () => {
    try {
      const page = await pApi.functional.autobe.playground.sessions.index(
        getConnection(),
        {
          limit: 100,
          vendor_id: filterVendorId ?? undefined,
          model: filterModel || undefined,
        },
      );
      setSessions(page.data);
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setSessions([]);
    }
  }, [filterVendorId, filterModel]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions, sessionList]);

  const handleNewChat = () => {
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      next.delete("session-id");
      return next;
    });
  };

  const handleSessionSelect = (id: string) => {
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      next.set("session-id", id);
      return next;
    });
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
      {/* Toggle + New Chat */}
      <Box
        sx={{
          display: "flex",
          justifyContent: props.isCollapsed ? "center" : "space-between",
          alignItems: "center",
          p: 0.5,
          gap: 0.5,
        }}
      >
        {!props.isCollapsed && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={handleNewChat}
            sx={{
              ml: 0.5,
              textTransform: "none",
              fontSize: "0.75rem",
              py: 0.25,
            }}
          >
            New Chat
          </Button>
        )}
        <IconButton size="small" onClick={props.onToggle}>
          {props.isCollapsed ? (
            <ChevronRight fontSize="small" />
          ) : (
            <ChevronLeft fontSize="small" />
          )}
        </IconButton>
      </Box>

      {!props.isCollapsed && (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Divider />

          {/* Filters */}
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5, display: "block" }}
            >
              Filters
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 0.5 }}>
              <Select
                value={filterVendorId ?? ""}
                onChange={(e) => setFilterVendorId(e.target.value || null)}
                displayEmpty
                sx={{ fontSize: "0.75rem" }}
              >
                <MenuItem value="">
                  <em>All Vendors</em>
                </MenuItem>
                {vendors.map((v) => (
                  <MenuItem
                    key={v.id}
                    value={v.id}
                    sx={{ fontSize: "0.75rem" }}
                  >
                    {v.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Autocomplete
              freeSolo
              size="small"
              options={vendorModels.map((m) => m.model)}
              value={filterModel ?? ""}
              onInputChange={(_, value) => setFilterModel(value || null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Filter by model..."
                  sx={{ "& input": { fontSize: "0.75rem", py: 0.5 } }}
                />
              )}
            />
          </Box>

          <Divider />

          {/* Sessions */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.5, px: 1.5, pt: 1, pb: 0.5, display: "block" }}
            >
              Sessions
            </Typography>
            <SessionsPanel
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelect={handleSessionSelect}
              onDelete={handleSessionDelete}
            />
          </Box>
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
                  sx={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "0.82rem",
                  }}
                >
                  {title}
                </Typography>
              }
              secondary={
                <Stack direction="column" spacing={0.25} sx={{ mt: 0.25 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ fontSize: "0.68rem" }}
                  >
                    {s.vendor?.name ?? "Unknown"} / {s.model}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.5}
                    alignItems="center"
                    flexWrap="wrap"
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
                  {s.token_usage.total > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.65rem" }}
                    >
                      {formatTokens(s.token_usage.total)} tokens
                      {" (in: "}
                      {formatTokens(s.token_usage.input.total)}
                      {s.token_usage.input.cached > 0 && (
                        <>, {formatTokens(s.token_usage.input.cached)} cached</>
                      )}
                      {" / out: "}
                      {formatTokens(s.token_usage.output.total)}
                      {")"}
                    </Typography>
                  )}
                </Stack>
              }
            />
            {!isActive && (
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
            )}
          </ListItemButton>
        );
      })}
    </List>
  );
};

function formatTokens(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
