import pApi from "@autobe/playground-api";
import { AutoBeListener } from "@autobe/ui";
import { ErrorOutline, ReplayOutlined } from "@mui/icons-material";

import { getServerUrl } from "../../utils/connection";
import {
  Alert,
  AlertTitle,
  AppBar,
  Box,
  CircularProgress,
  Container,
  LinearProgress,
  Skeleton,
  Stack,
  Toolbar,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";

import { AutoBeAgentSessionStorageMockStrategy } from "../../strategy/AutoBeAgentSessionStorageMockStrategy";
import { AutoBePlaygroundChatMovie } from "../chat/AutoBePlaygroundChatMovie";

export const AutoBePlaygroundReplayGetMovie = () => {
  const theme = useTheme();
  const [params] = useState(() => getReplayParams());
  const [next, setNext] = useState<AutoBePlaygroundChatMovie.IProps | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (params === null) return;

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    const connect = async () => {
      // Complete the progress
      setLoadingProgress(100);
      clearInterval(progressInterval);

      const isExample = params.type === "example";
      const title = isExample
        ? `AutoBE Playground (Example: ${params.vendor}/${params.project})`
        : "AutoBE Playground (Replay)";

      setNext({
        title,
        storageStrategyFactory: () =>
          new AutoBeAgentSessionStorageMockStrategy(),
        serviceFactory: async () => {
          const listener: AutoBeListener = new AutoBeListener();
          const host = getServerUrl();

          if (isExample) {
            const { connector, driver } =
              await pApi.functional.autobe.playground.examples.replay(
                { host },
                {
                  vendor: params.vendor,
                  project: params.project,
                },
                listener.getListener(),
              );
            return {
              service: driver,
              listener,
              sessionId: `example:${params.vendor}/${params.project}`,
              close: () => connector.close(),
            };
          } else {
            const { connector, driver } =
              await pApi.functional.autobe.playground.sessions.replay(
                { host },
                params.sessionId,
                listener.getListener(),
              );
            return {
              service: driver,
              listener,
              sessionId: params.sessionId,
              close: () => connector.close(),
            };
          }
        },
      });
    };

    connect().catch((err) => {
      clearInterval(progressInterval);
      setError(err as Error);
    });
  }, [params]);

  // Invalid props error
  if (params === null) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: theme.palette.background.default,
        }}
      >
        <Container maxWidth="sm">
          <Alert severity="error" icon={<ErrorOutline />}>
            <AlertTitle>Invalid Parameters</AlertTitle>
            Missing required URL parameters. Provide either session-id or
            vendor + project.
          </Alert>
        </Container>
      </Box>
    );
  }

  // Successfully loaded
  if (next !== null) {
    return (
      <AutoBePlaygroundChatMovie
        title={next.title}
        serviceFactory={next.serviceFactory}
        isUnusedConfig={true}
        isReplay={true}
        hideSidebar={true}
        storageStrategyFactory={next.storageStrategyFactory}
      />
    );
  }

  // Error state
  if (error !== null) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppBar position="relative" component="div">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              AutoBE Playground (Replay)
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: theme.palette.background.default,
          }}
        >
          <Container maxWidth="sm">
            <Alert
              severity="error"
              icon={<ErrorOutline sx={{ fontSize: 48 }} />}
            >
              <AlertTitle sx={{ fontSize: "1.25rem" }}>
                Failed to Load Replay
              </AlertTitle>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {error.message}
              </Typography>
            </Alert>
          </Container>
        </Box>
      </Box>
    );
  }

  // Loading state
  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AppBar position="relative" component="div">
        <Toolbar>
          <ReplayOutlined sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AutoBE Playground (Replay)
          </Typography>
          <CircularProgress
            size={24}
            sx={{
              color: theme.palette.common.white,
            }}
          />
        </Toolbar>
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
      </AppBar>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: theme.palette.background.default,
        }}
      >
        <Container maxWidth="md" sx={{ mt: -8 }}>
          <Stack spacing={4} alignItems="center">
            {/* Loading Animation */}
            <Box
              sx={{
                position: "relative",
                display: "inline-flex",
              }}
            >
              <CircularProgress
                size={80}
                thickness={4}
                sx={{
                  color: theme.palette.primary.main,
                }}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: "absolute",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ReplayOutlined
                  sx={{
                    fontSize: 32,
                    color: theme.palette.primary.main,
                  }}
                />
              </Box>
            </Box>

            {/* Loading Text */}
            <Stack spacing={2} alignItems="center">
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                }}
              >
                Loading Replay Data
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.secondary,
                }}
              >
                {params.type === "example"
                  ? `Example: ${params.vendor} / ${params.project}`
                  : `Session: ${params.sessionId}`}
              </Typography>
            </Stack>

            {/* Chat skeleton preview */}
            <Box sx={{ width: "100%", maxWidth: 600, mt: 4 }}>
              <Stack spacing={3}>
                {/* System message skeleton */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                >
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton
                    variant="text"
                    width="80%"
                    height={20}
                    sx={{ mt: 1 }}
                  />
                </Box>

                {/* Chat message skeletons */}
                {[1, 2, 3].map((i) => (
                  <Box key={i}>
                    <Skeleton
                      variant="rounded"
                      height={60}
                      sx={{
                        bgcolor: alpha(theme.palette.action.hover, 0.1),
                        animation: "pulse 1.5s ease-in-out infinite",
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

type ReplayParams =
  | { type: "session"; sessionId: string }
  | { type: "example"; vendor: string; project: string };

const getReplayParams = (): ReplayParams | null => {
  const query = new URLSearchParams(window.location.search);

  // Check example params first — SearchParamsProvider may inject a
  // session-id into the URL after the initial connection, so on refresh
  // we must prefer the original vendor/project params.
  const vendor = query.get("vendor");
  const project = query.get("project");
  if (vendor && project) return { type: "example", vendor, project };

  const sessionId = query.get("session-id");
  if (sessionId) return { type: "session", sessionId };

  return null;
};
