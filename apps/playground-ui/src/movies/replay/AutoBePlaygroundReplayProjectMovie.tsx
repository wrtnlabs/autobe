import {
  AutoBePhase,
  IAutoBePlaygroundSession,
} from "@autobe/interface";
import {
  AccessTime,
  ArrowForwardIos,
  Token,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

export const AutoBePlaygroundReplayProjectMovie = ({
  session,
}: AutoBePlaygroundReplayProjectMovie.IProps) => {
  const theme = useTheme();

  const formatElapsedTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const paddedSeconds = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${paddedSeconds(seconds % 60)}s`;
    } else if (minutes > 0) {
      return ` ${minutes}m ${paddedSeconds(seconds % 60)}s`;
    } else {
      return `${paddedSeconds(seconds)}s`;
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

  const getPhaseColor = (p: AutoBePhase | null) => {
    const colors = {
      analyze: theme.palette.info.main,
      database: theme.palette.secondary.main,
      interface: theme.palette.primary.main,
      test: theme.palette.warning.main,
      realize: theme.palette.success.main,
    };
    return colors[p as keyof typeof colors] ?? theme.palette.grey[500];
  };

  const getVendorColor = (vendor: string) => {
    const colors: Record<string, string> = {
      Anthropic: theme.palette.error.main,
      OpenAI: theme.palette.success.main,
      Google: theme.palette.info.main,
    };
    return colors[vendor] || theme.palette.grey[500];
  };

  const phaseColor = getPhaseColor(session.phase);
  const vendorColor = getVendorColor(session.vendor.name);

  // Use aggregate token usage (already summed across all phases)
  const tokenUsage = session.token_usage.aggregate;

  // Compute elapsed time from timestamps
  const elapsed =
    session.completed_at != null
      ? new Date(session.completed_at).getTime() -
        new Date(session.created_at).getTime()
      : Date.now() - new Date(session.created_at).getTime();

  const title = session.title ?? session.model;

  return (
    <Card
      sx={{
        height: "100%",
        transition: "all 0.3s ease-in-out",
        border: `1px solid ${alpha(phaseColor, 0.2)}`,
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px ${alpha(phaseColor, 0.2)}`,
          borderColor: phaseColor,
        },
      }}
    >
      <CardActionArea
        component="a"
        href={`/replay/get?session-id=${session.id}`}
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
                  fontSize: { xs: "1.2rem", sm: "1.4rem" },
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "60%",
                }}
              >
                {title}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={session.vendor.name}
                  size="small"
                  sx={{
                    backgroundColor: alpha(vendorColor, 0.1),
                    color: vendorColor,
                    fontWeight: 600,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                />
                <ArrowForwardIos
                  sx={{
                    fontSize: 16,
                    color: "text.secondary",
                  }}
                />
              </Stack>
            </Stack>
            <Divider sx={{ mt: 1.5 }} />
          </Box>

          {/* Model & Phase Info */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontSize: "0.8rem" }}
              >
                Model:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, fontSize: "0.8rem" }}
              >
                {session.model}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontSize: "0.8rem" }}
              >
                Phase:
              </Typography>
              {session.phase != null ? (
                <Chip
                  label={session.phase}
                  size="small"
                  sx={{
                    backgroundColor: alpha(phaseColor, 0.1),
                    color: phaseColor,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: 22,
                    textTransform: "capitalize",
                  }}
                />
              ) : (
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontSize: "0.8rem" }}
                >
                  Not started
                </Typography>
              )}
              {session.completed_at != null && (
                <Chip
                  label="Completed"
                  size="small"
                  sx={{
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: 22,
                  }}
                />
              )}
            </Stack>
          </Box>

          {/* Stats */}
          <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ flexGrow: 1 }}>
            {/* Elapsed Time */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <AccessTime
                  sx={{
                    fontSize: 18,
                    color: "text.secondary",
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Elapsed Time
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: phaseColor,
                  fontSize: {
                    xs: "1rem",
                    sm: "1.1rem",
                    md: "1.25rem",
                  },
                }}
              >
                {formatElapsedTime(elapsed)}
              </Typography>
            </Box>

            {/* Total Tokens */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <Token
                  sx={{
                    fontSize: 18,
                    color: "text.secondary",
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Total Tokens
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="flex-start">
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
                  {formatTokenCount(tokenUsage.total)}
                </Typography>
                <Stack direction="column" spacing={0} sx={{ mt: 0.2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: {
                        xs: "0.7rem",
                        sm: "0.75rem",
                      },
                      color: "text.secondary",
                    }}
                  >
                    in: {formatTokenCount(tokenUsage.input.total)}
                    {tokenUsage.input.cached > 0
                      ? ` (${formatTokenCount(tokenUsage.input.cached)} cached)`
                      : ""}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: {
                        xs: "0.7rem",
                        sm: "0.75rem",
                      },
                      color: "text.secondary",
                    }}
                  >
                    out: {formatTokenCount(tokenUsage.output.total)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export namespace AutoBePlaygroundReplayProjectMovie {
  export interface IProps {
    session: IAutoBePlaygroundSession.ISummary;
  }
}
