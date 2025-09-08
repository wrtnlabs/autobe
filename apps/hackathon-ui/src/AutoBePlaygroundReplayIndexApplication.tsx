import { IAutoBePlaygroundReplay } from "@autobe/interface";
import pApi from "@autobe/playground-api";
import { ReplayOutlined } from "@mui/icons-material";
import {
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

import { AutoBePlaygroundReplayIndexMovie } from "./movies/replay/AutoBePlaygroundReplayIndexMovie";

export function AutoBePlaygroundReplayIndexApplication() {
  const theme = useTheme();
  const [replays, setRelays] = useState<
    IAutoBePlaygroundReplay.ISummary[] | null
  >(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const load = async () => {
      // Simulate loading progress
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      setRelays(
        await pApi.functional.autobe.playground.replay.index(CONNECTION),
      );

      // Complete the progress
      setLoadingProgress(100);
      clearInterval(progressInterval);
    };
    load().catch(console.error);
  }, []);

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
            AutoBE Playground (List of Replays)
          </Typography>
          {replays === null && (
            <CircularProgress
              size={24}
              sx={{
                color: theme.palette.common.white,
              }}
            />
          )}
        </Toolbar>
        {replays === null && (
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

      {replays === null ? (
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
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                }}
              >
                Loading Replay Data...
              </Typography>

              {/* Skeleton Preview */}
              <Box sx={{ width: "100%", mt: 4 }}>
                <Stack spacing={3}>
                  {["Anthropic", "OpenAI", "Google"].map((vendor) => (
                    <Box key={vendor}>
                      <Skeleton
                        variant="text"
                        width={120}
                        height={32}
                        sx={{ mb: 2 }}
                      />
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "1fr 1fr",
                            md: "1fr 1fr 1fr",
                          },
                          gap: 3,
                        }}
                      >
                        {[1, 2, 3].map((i) => (
                          <Skeleton
                            key={i}
                            variant="rounded"
                            height={280}
                            sx={{
                              bgcolor: alpha(theme.palette.action.hover, 0.1),
                              animation: "pulse 1.5s ease-in-out infinite",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Container>
        </Box>
      ) : (
        <div
          style={{
            width: "100%",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <AutoBePlaygroundReplayIndexMovie replays={replays} />
        </div>
      )}
    </div>
  );
}

const CONNECTION: pApi.IConnection = {
  /** Loopback address */
  host: "http://127.0.0.1:5890",
};
