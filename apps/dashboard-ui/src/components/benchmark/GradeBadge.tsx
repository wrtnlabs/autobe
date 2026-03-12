import { Chip } from "@mui/material";

import type { Grade } from "../../types/benchmark";
import { getGradeColor } from "../../theme/gradeColors";
import { useThemeMode } from "../../theme/ThemeContext";

interface GradeBadgeProps {
  grade: Grade;
  size?: "small" | "medium";
}

export function GradeBadge({ grade, size = "small" }: GradeBadgeProps) {
  const { mode } = useThemeMode();
  const colors = getGradeColor(grade, mode);

  return (
    <Chip
      label={grade}
      size={size}
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        fontWeight: 700,
        fontSize: size === "small" ? "0.75rem" : "0.875rem",
        minWidth: 32,
      }}
    />
  );
}
