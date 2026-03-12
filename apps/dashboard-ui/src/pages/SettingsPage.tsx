import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";

import { useThemeMode } from "../theme/ThemeContext";

export function SettingsPage() {
  const { mode, toggleMode } = useThemeMode();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Appearance
          </Typography>
          <FormControlLabel
            control={
              <Switch checked={mode === "dark"} onChange={toggleMode} />
            }
            label="Dark Mode"
          />
        </CardContent>
      </Card>
    </Box>
  );
}
