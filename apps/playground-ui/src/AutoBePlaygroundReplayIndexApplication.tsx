import {
  IAutoBePlaygroundBenchmark,
  IAutoBePlaygroundSession,
} from "@autobe/interface";
import pApi from "@autobe/playground-api";
import {
  AddCircleOutline,
  ReplayOutlined,
  Science,
  Settings,
  Storage,
} from "@mui/icons-material";
import {
  AppBar,
  Box,
  Button,
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

import { AutoBePlaygroundExampleMovie } from "./movies/examples/AutoBePlaygroundExampleMovie";
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
  const [benchmarks, setBenchmarks] = useState<
    IAutoBePlaygroundBenchmark[] | null
  >(null);

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
    setBenchmarks(list);
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
  const benchmarkList = benchmarks ?? [];
  const uniqueVendors = benchmarkList.map((b) => b.vendor);
  const selectedBenchmark = benchmarkList.find((b) => b.vendor === mockVendor);
  const availableProjects = selectedBenchmark
    ? selectedBenchmark.replays.map((r) => r.project)
    : [];

  const handleOpenMockDialog = () => {
    setMockOpen(true);
    if (benchmarkList.length > 0 && !mockVendor) {
      const first = benchmarkList[0];
      setMockVendor(first.vendor);
      if (first.replays.length > 0) setMockProject(first.replays[0].project);
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

  const loading = sessions === null || benchmarks === null;

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
          {tab === 1 && benchmarks && (
            <AutoBePlaygroundExampleMovie benchmarks={benchmarks} />
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
            {benchmarkList.length === 0 ? (
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
                      const bench = benchmarkList.find(
                        (b) => b.vendor === e.target.value,
                      );
                      if (bench && bench.replays.length > 0)
                        setMockProject(bench.replays[0].project);
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
