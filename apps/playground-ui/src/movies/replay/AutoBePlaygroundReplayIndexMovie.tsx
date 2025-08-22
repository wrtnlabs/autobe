import { IAutoBePlaygroundReplay } from "@autobe/interface";
import {
  AccessTime,
  ArrowForwardIos,
  Memory,
  Token,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

export const AutoBePlaygroundReplayIndexMovie = ({
  replays,
}: AutoBePlaygroundReplayIndexMovie.IProps) => {
  const theme = useTheme();

  const formatElapsedTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTokenCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(2)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getStepColor = (step: string) => {
    const colors = {
      analyze: theme.palette.info.main,
      prisma: theme.palette.secondary.main,
      interface: theme.palette.primary.main,
      test: theme.palette.warning.main,
      realize: theme.palette.success.main,
    };
    return colors[step as keyof typeof colors] || theme.palette.grey[500];
  };

  const calculateTokenEfficiency = (
    tokenUsage: IAutoBePlaygroundReplay.ISummary["tokenUsage"],
  ) => {
    const total = tokenUsage.aggregate.total;
    const cached = tokenUsage.aggregate.input.cached;
    return total > 0 ? (cached / total) * 100 : 0;
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: { xs: 2, sm: 3, md: 4 },
          fontWeight: 600,
          fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
        }}
      >
        AutoBE Playground Replays
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {replays.map((replay, index) => {
          const stepColor = getStepColor(replay.step);
          const efficiency = calculateTokenEfficiency(replay.tokenUsage);

          return (
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }} key={index}>
              <Card
                sx={{
                  height: "100%",
                  transition: "all 0.3s ease-in-out",
                  border: `1px solid ${alpha(stepColor, 0.2)}`,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 8px 24px ${alpha(stepColor, 0.2)}`,
                    borderColor: stepColor,
                  },
                }}
              >
                <CardActionArea
                  component="a"
                  href={`./get.html?vendor=${replay.vendor}&project=${replay.project}&step=${replay.step}`}
                  target="_blank"
                  sx={{ height: "100%" }}
                >
                  <CardContent
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      p: { xs: 2, sm: 2.5, md: 3 },
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ mb: 2 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={1}
                      >
                        <Typography
                          variant="h6"
                          component="h2"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "1.1rem", sm: "1.25rem" },
                          }}
                        >
                          {replay.project}
                        </Typography>
                        <ArrowForwardIos
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                      </Stack>
                      <Stack direction="row" gap={1} alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          {replay.vendor}
                        </Typography>
                        <Chip
                          label={replay.step}
                          size="small"
                          sx={{
                            bgcolor: alpha(stepColor, 0.1),
                            color: stepColor,
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        />
                      </Stack>
                    </Box>

                    {/* Stats */}
                    <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ flexGrow: 1 }}>
                      {/* Elapsed Time */}
                      <Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          mb={0.5}
                        >
                          <AccessTime
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Elapsed Time
                          </Typography>
                        </Stack>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: stepColor,
                            fontSize: {
                              xs: "1rem",
                              sm: "1.1rem",
                              md: "1.25rem",
                            },
                          }}
                        >
                          {formatElapsedTime(replay.elapsed)}
                        </Typography>
                      </Box>

                      {/* Total Tokens */}
                      <Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          mb={0.5}
                        >
                          <Token
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Total Tokens
                          </Typography>
                        </Stack>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            fontSize: {
                              xs: "1rem",
                              sm: "1.1rem",
                              md: "1.25rem",
                            },
                          }}
                        >
                          {formatTokenCount(replay.tokenUsage.aggregate.total)}
                        </Typography>
                      </Box>

                      {/* Cache Efficiency */}
                      <Box>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          mb={0.5}
                        >
                          <Memory
                            sx={{ fontSize: 18, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Cache Efficiency
                          </Typography>
                        </Stack>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={efficiency}
                            sx={{
                              flexGrow: 1,
                              height: 8,
                              borderRadius: 4,
                              bgcolor: alpha(stepColor, 0.1),
                              "& .MuiLinearProgress-bar": {
                                bgcolor: stepColor,
                                borderRadius: 4,
                              },
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              minWidth: { xs: 40, sm: 45 },
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            }}
                          >
                            {efficiency.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>

                    {/* Token Breakdown */}
                    <Box
                      sx={{
                        mt: { xs: 1.5, sm: 2 },
                        pt: { xs: 1.5, sm: 2 },
                        borderTop: `1px solid ${alpha(stepColor, 0.1)}`,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                          >
                            Input
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: "0.85rem", sm: "0.875rem" },
                            }}
                          >
                            {formatTokenCount(
                              replay.tokenUsage.aggregate.input.total,
                            )}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                          >
                            Output
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: "0.85rem", sm: "0.875rem" },
                            }}
                          >
                            {formatTokenCount(
                              replay.tokenUsage.aggregate.output.total,
                            )}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};
export namespace AutoBePlaygroundReplayIndexMovie {
  export interface IProps {
    replays: IAutoBePlaygroundReplay.ISummary[];
  }
}
