import { useNavigate } from "react-router-dom";
import { Box, Card, CardActionArea, CardContent, LinearProgress, Typography } from "@mui/material";

import type { BenchmarkEntry, ScoringPhase } from "../../types/benchmark";
import { PHASE_DISPLAY_NAMES, PHASE_WEIGHTS, SCORING_PHASES } from "../../types/benchmark";
import { GradeBadge } from "./GradeBadge";
import { useThemeMode } from "../../theme/ThemeContext";
import { getGradeColor } from "../../theme/gradeColors";

interface ProjectScoreCardProps {
  entry: BenchmarkEntry;
}

const PHASE_COLORS: Record<ScoringPhase, string> = {
  documentQuality: "#60a5fa",
  requirementsCoverage: "#34d399",
  testCoverage: "#fbbf24",
  logicCompleteness: "#f87171",
  apiCompleteness: "#a78bfa",
};

export function ProjectScoreCard({ entry }: ProjectScoreCardProps) {
  const { mode } = useThemeMode();
  const colors = getGradeColor(entry.grade, mode);
  const navigate = useNavigate();

  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        "&:hover": { borderColor: colors.text, transition: "border-color 0.2s" },
      }}
    >
      <CardActionArea
        onClick={() =>
          navigate(
            `/benchmark/${encodeURIComponent(entry.model)}/${encodeURIComponent(entry.project)}`,
          )
        }
      >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{ textTransform: "capitalize", fontWeight: 600 }}
          >
            {entry.project}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colors.text }}>
              {entry.totalScore}
            </Typography>
            <GradeBadge grade={entry.grade} size="medium" />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {SCORING_PHASES.map((phase) => (
            <Box key={phase}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.25,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {PHASE_DISPLAY_NAMES[phase]}{" "}
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.disabled"
                  >
                    ({Math.round(PHASE_WEIGHTS[phase] * 100)}%)
                  </Typography>
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {entry.phases[phase].score}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={entry.phases[phase].score}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: "action.hover",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: PHASE_COLORS[phase],
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Gate status */}
        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Gate: {entry.phases.gate.passed ? "Pass" : "Fail"} ({entry.phases.gate.score}/100)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {entry.meta.evaluatedFiles} files
          </Typography>
        </Box>
      </CardContent>
      </CardActionArea>
    </Card>
  );
}
