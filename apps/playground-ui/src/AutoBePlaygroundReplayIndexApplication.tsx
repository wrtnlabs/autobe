import {
  IAutoBePlaygroundExample,
  IAutoBePlaygroundSession,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import {
  AddCircleOutline,
  PlayArrow,
  ReplayOutlined,
  Science,
  Settings,
  Storage,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { AutoBePlaygroundReplayIndexMovie } from "./movies/replay/AutoBePlaygroundReplayIndexMovie";
import { AutoBePlaygroundSettingsMovie } from "./movies/settings/AutoBePlaygroundSettingsMovie";
import { getConnection } from "./utils/connection";

export function AutoBePlaygroundReplayIndexApplication() {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  // Sessions state
  const [sessions, setSessions] = useState<
    IAutoBePlaygroundSession.ISummary[] | null
  >(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Examples state
  const [examples, setExamples] = useState<IAutoBePlaygroundExample[] | null>(
    null,
  );

  // Mock dialog state
  const [mockOpen, setMockOpen] = useState(false);
  const [mockVendor, setMockVendor] = useState("");
  const [mockProject, setMockProject] = useState("");
  const [creating, setCreating] = useState(false);

  const loadSessions = useCallback(async () => {
    const page = await pApi.functional.autobe.playground.sessions.index(
      getConnection(),
      {},
    );
    setSessions(page.data);
  }, []);

  const loadExamples = useCallback(async () => {
    const list = await pApi.functional.autobe.playground.examples.index(
      getConnection(),
    );
    setExamples(list);
  }, []);

  useEffect(() => {
    const load = async () => {
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      await Promise.all([loadSessions(), loadExamples()]);
      setLoadingProgress(100);
      clearInterval(progressInterval);
    };
    load().catch(console.error);
  }, [loadSessions, loadExamples]);

  // Mock dialog helpers
  const mockExamples = examples ?? [];
  const uniqueVendors = [...new Set(mockExamples.map((e) => e.vendor))];
  const availableProjects = mockExamples
    .filter((e) => e.vendor === mockVendor)
    .map((e) => e.project);

  const handleOpenMockDialog = () => {
    setMockOpen(true);
    if (mockExamples.length > 0 && !mockVendor) {
      setMockVendor(mockExamples[0].vendor);
      setMockProject(mockExamples[0].project);
    }
  };

  const handleCreateMock = async () => {
    setCreating(true);
    try {
      const session =
        await pApi.functional.autobe.playground.sessions.create(
          getConnection(),
          { mock: { vendor: mockVendor, project: mockProject } },
        );
      window.location.href = `/?session-id=${session.id}`;
    } catch (err) {
      console.error("Failed to create mock session:", err);
      setCreating(false);
    }
  };

  const loading = sessions === null || examples === null;

  // Group examples by vendor
  const examplesByVendor = (examples ?? []).reduce(
    (acc, ex) => {
      (acc[ex.vendor] ??= []).push(ex);
      return acc;
    },
    {} as Record<string, IAutoBePlaygroundExample[]>,
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <AppBar position="relative" component="div">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AutoBE Playground
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddCircleOutline />}
            onClick={handleOpenMockDialog}
            sx={{
              color: theme.palette.common.white,
              borderColor: alpha(theme.palette.common.white, 0.5),
              mr: 2,
              "&:hover": { borderColor: theme.palette.common.white },
            }}
          >
            Mock
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              sx={{ color: theme.palette.common.white }}
            />
          )}
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            bgcolor: alpha(theme.palette.common.black, 0.1),
            "& .MuiTab-root": {
              color: alpha(theme.palette.common.white, 0.7),
            },
            "& .Mui-selected": { color: theme.palette.common.white },
            "& .MuiTabs-indicator": {
              bgcolor: theme.palette.common.white,
            },
          }}
        >
          <Tab
            icon={<Storage sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Sessions"
          />
          <Tab
            icon={<Science sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Examples"
          />
          <Tab
            icon={<Settings sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Settings"
          />
        </Tabs>
        {loading && (
          <LinearProgress
            variant="determinate"
            value={loadingProgress}
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
            }}
          />
        )}
      </AppBar>

      {loading && tab !== 2 ? (
        <Box
          sx={{
            width: "100%",
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme.palette.background.default,
          }}
        >
          <Container maxWidth="lg" sx={{ mt: 12 }}>
            <Stack spacing={4} alignItems="center">
              <Box sx={{ position: "relative", display: "inline-flex" }}>
                <CircularProgress
                  size={80}
                  thickness={4}
                  sx={{ color: theme.palette.primary.main }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ReplayOutlined
                    sx={{ fontSize: 32, color: theme.palette.primary.main }}
                  />
                </Box>
              </Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 500, color: theme.palette.text.primary }}
              >
                Loading...
              </Typography>
              <Box sx={{ width: "100%", mt: 4 }}>
                <Stack spacing={3}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      variant="rounded"
                      height={120}
                      sx={{
                        bgcolor: alpha(theme.palette.action.hover, 0.1),
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Container>
        </Box>
      ) : (
        <div style={{ width: "100%", flex: 1, overflow: "hidden" }}>
          {/* Sessions Tab */}
          {tab === 0 && sessions && (
            <AutoBePlaygroundReplayIndexMovie sessions={sessions} />
          )}

          {/* Examples Tab */}
          {tab === 1 && (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                bgcolor: theme.palette.background.default,
              }}
            >
              <Container maxWidth="lg" sx={{ py: 4 }}>
                {Object.keys(examplesByVendor).length === 0 ? (
                  <Typography
                    sx={{
                      textAlign: "center",
                      color: theme.palette.text.secondary,
                      mt: 8,
                    }}
                  >
                    No examples available.
                  </Typography>
                ) : (
                  <Stack spacing={4}>
                    {Object.entries(examplesByVendor).map(
                      ([vendor, items]) => (
                        <Box key={vendor}>
                          <Typography
                            variant="h6"
                            sx={{ mb: 2, fontWeight: 600 }}
                          >
                            {vendor}
                          </Typography>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "1fr 1fr",
                                md: "1fr 1fr 1fr",
                                lg: "1fr 1fr 1fr 1fr",
                              },
                              gap: 2,
                            }}
                          >
                            {items.map((ex) => (
                              <Card
                                key={`${ex.vendor}/${ex.project}`}
                                variant="outlined"
                              >
                                <CardContent sx={{ pb: 1 }}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {ex.project}
                                  </Typography>
                                  <Box
                                    sx={{
                                      mt: 1,
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 0.5,
                                    }}
                                  >
                                    {ex.phases.map((phase) => (
                                      <Chip
                                        key={phase}
                                        label={phase}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    ))}
                                  </Box>
                                </CardContent>
                                <CardActions>
                                  <Button
                                    size="small"
                                    startIcon={<PlayArrow />}
                                    href={`/replay/get?example-vendor=${encodeURIComponent(ex.vendor)}&example-project=${encodeURIComponent(ex.project)}`}
                                  >
                                    Replay
                                  </Button>
                                  <Button
                                    size="small"
                                    startIcon={<AddCircleOutline />}
                                    onClick={async () => {
                                      const session =
                                        await pApi.functional.autobe.playground.sessions.create(
                                          getConnection(),
                                          {
                                            mock: {
                                              vendor: ex.vendor,
                                              project: ex.project,
                                            },
                                          },
                                        );
                                      window.location.href = `/?session-id=${session.id}`;
                                    }}
                                  >
                                    Mock Chat
                                  </Button>
                                </CardActions>
                              </Card>
                            ))}
                          </Box>
                        </Box>
                      ),
                    )}
                  </Stack>
                )}
              </Container>
            </Box>
          )}

          {/* Settings Tab */}
          {tab === 2 && <AutoBePlaygroundSettingsMovie />}
        </div>
      )}

      {/* Mock Session Dialog */}
      <Dialog
        open={mockOpen}
        onClose={() => setMockOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Create Mock Session</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {mockExamples.length === 0 ? (
              <Box
                sx={{ display: "flex", justifyContent: "center", py: 2 }}
              >
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                <FormControl fullWidth size="small">
                  <InputLabel>Vendor / Model</InputLabel>
                  <Select
                    value={mockVendor}
                    label="Vendor / Model"
                    onChange={(e) => {
                      setMockVendor(e.target.value);
                      const first = mockExamples.find(
                        (ex) => ex.vendor === e.target.value,
                      );
                      if (first) setMockProject(first.project);
                    }}
                  >
                    {uniqueVendors.map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Project</InputLabel>
                  <Select
                    value={mockProject}
                    label="Project"
                    onChange={(e) => setMockProject(e.target.value)}
                  >
                    {availableProjects.map((p) => (
                      <MenuItem key={p} value={p}>
                        {p}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMockOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateMock}
            variant="contained"
            disabled={creating || !mockVendor || !mockProject}
            startIcon={
              creating ? (
                <CircularProgress size={16} />
              ) : (
                <AddCircleOutline />
              )
            }
          >
            {creating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
