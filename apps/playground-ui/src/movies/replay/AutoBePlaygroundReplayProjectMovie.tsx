import { IAutoBePlaygroundReplay } from "@autobe/interface";
import {
  AccessTime,
  ArrowForwardIos,
  Cancel,
  CheckCircle,
  Token,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  alpha,
  useTheme,
  Chip,
} from "@mui/material";

export const AutoBePlaygroundReplayProjectMovie = ({
  replay,
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

  const getVendorColor = (vendor: string) => {
    const colors = {
      Anthropic: theme.palette.error.main,
      OpenAI: theme.palette.success.main,
      Google: theme.palette.info.main,
    };
    return colors[vendor as keyof typeof colors] || theme.palette.grey[500];
  };

  const steps = ["analyze", "prisma", "interface", "test", "realize"];
  const getStepIndex = (step: string) => steps.indexOf(step);

  const stepColor = getStepColor(replay.step);
  const vendorColor = getVendorColor(replay.vendor);

  return (
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
                  fontSize: { xs: "1.2rem", sm: "1.4rem" },
                }}
              >
                {replay.project}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={replay.vendor}
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

          {/* Stepper */}
          <Box sx={{ mb: 2 }}>
            <Stepper
              activeStep={getStepIndex(replay.step)}
              orientation="vertical"
              sx={{
                "& .MuiStepConnector-line": {
                  borderLeftWidth: 2,
                  minHeight: 8,
                },
                "& .MuiStep-root": {
                  paddingBottom: 0,
                  paddingTop: 0,
                  paddingLeft: 0,
                  paddingRight: 0,
                },
                "& .MuiStepLabel-root": {
                  paddingTop: 0,
                  paddingBottom: 0,
                  minHeight: 24,
                },
                "& .MuiStepContent-root": {
                  paddingTop: 0,
                  paddingBottom: 0,
                  marginTop: 0,
                  marginBottom: 0,
                },
              }}
            >
              {steps.map((label) => {
                const stepData =
                  replay[
                    label as keyof Pick<
                      IAutoBePlaygroundReplay.ISummary,
                      | "analyze"
                      | "prisma"
                      | "interface"
                      | "test"
                      | "realize"
                    >
                  ];
                const isCurrentStep = label === replay.step;
                const stepElapsed = stepData?.elapsed || 0;

                let stepIcon;
                let stepColor;

                if (stepData === null) {
                  // Not executed yet - gray
                  stepIcon = undefined;
                  stepColor = theme.palette.grey[400];
                } else if (stepData.success === true) {
                  stepIcon = CheckCircle;
                  stepColor = theme.palette.primary.main; // Blue for success
                } else if (stepData.success === false) {
                  stepIcon = Cancel;
                  stepColor = theme.palette.error.main; // Red for failure
                } else {
                  // Currently executing (success is null but has stepData)
                  stepIcon = undefined;
                  stepColor = getStepColor(label); // Use step's own color
                }

                return (
                  <Step key={label}>
                    <StepLabel
                      slots={{ stepIcon }}
                      sx={{
                        "& .MuiStepLabel-label": {
                          color: stepColor,
                          fontWeight: isCurrentStep
                            ? 700 // Bold for current step
                            : 400,
                          textTransform: "capitalize",
                          fontSize: {
                            xs: "0.5rem",
                            sm: "0.55rem",
                            md: "0.76em",
                          },
                          mt: 0,
                          ml: 1,
                        },
                        "& .MuiStepIcon-root": {
                          color: stepColor,
                          fontSize: {
                            xs: "1.2rem",
                            sm: "1.4rem",
                            md: "1.5rem",
                          },
                        },
                        "& .MuiStepIcon-text": {
                          fill: "#fff",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          gap: 1,
                        }}
                      >
                        {/* Step name */}
                        <Typography
                          component="span"
                          sx={{
                            minWidth: 80,
                            textTransform: "capitalize",
                          }}
                        >
                          {label}
                        </Typography>

                        {/* Elapsed time */}
                        <Typography
                          component="span"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: {
                              xs: "0.65rem",
                              sm: "0.7rem",
                            },
                            minWidth: 70,
                            ml: 1,
                            textAlign: "right",
                            display: "inline-block",
                          }}
                        >
                          {stepData && stepElapsed > 0
                            ? formatElapsedTime(stepElapsed)
                            : "-"}
                        </Typography>

                        {/* Aggregate info */}
                        {stepData?.aggregate &&
                          Object.keys(stepData.aggregate)
                            .length > 0 && (
                            <Typography
                              component="span"
                              sx={{
                                color:
                                  theme.palette.text.secondary,
                                fontSize: {
                                  xs: "0.65rem",
                                  sm: "0.7rem",
                                },
                                ml: "auto",
                              }}
                            >
                              (
                              {Object.entries(
                                stepData.aggregate,
                              )
                                .map(
                                  ([key, value]) =>
                                    `${key.charAt(0).toUpperCase()}: ${value}`,
                                )
                                .join(", ")}
                              )
                            </Typography>
                          )}
                      </Box>
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>

          {/* Stats */}
          <Stack
            spacing={{ xs: 1.5, sm: 2 }}
            sx={{ flexGrow: 1 }}
          >
            {/* Elapsed Time */}
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                mb={0.5}
              >
                <AccessTime
                  sx={{
                    fontSize: 18,
                    color: "text.secondary",
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
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
                  sx={{
                    fontSize: 18,
                    color: "text.secondary",
                  }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Total Tokens
                </Typography>
              </Stack>
              <Stack direction="row" spacing={2}>
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
                  {formatTokenCount(
                    replay.tokenUsage.aggregate.total,
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: {
                      xs: "0.8rem",
                      sm: "0.875rem",
                    },
                    color: "text.secondary",
                    alignSelf: "flex-end",
                    pb: 0.3,
                  }}
                >
                  (in:{" "}
                  {formatTokenCount(
                    replay.tokenUsage.aggregate.input.total,
                  )}{" "}
                  / out:{" "}
                  {formatTokenCount(
                    replay.tokenUsage.aggregate.output.total,
                  )}
                  )
                </Typography>
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
    replay: IAutoBePlaygroundReplay.ISummary;
  }
}