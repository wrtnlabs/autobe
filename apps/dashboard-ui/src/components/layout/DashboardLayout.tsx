import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import DashboardIcon from "@mui/icons-material/Dashboard";

import { useThemeMode } from "../../theme/ThemeContext";

const TABS = [
  { label: "Benchmark", path: "/benchmark" },
  { label: "Monitoring", path: "/monitoring" },
  { label: "Settings", path: "/settings" },
];

export function DashboardLayout() {
  const { mode, toggleMode } = useThemeMode();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = TABS.findIndex((tab) =>
    location.pathname.startsWith(tab.path),
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Toolbar>
          <DashboardIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography
            variant="h6"
            sx={{ color: "text.primary", fontWeight: 700, mr: 4 }}
          >
            AutoBE Dashboard
          </Typography>
          <Tabs
            value={currentTab === -1 ? 0 : currentTab}
            onChange={(_e, idx) => navigate(TABS[idx].path)}
            sx={{ flexGrow: 1 }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.path}
                label={tab.label}
                sx={{ textTransform: "none", fontWeight: 500 }}
              />
            ))}
          </Tabs>
          <IconButton onClick={toggleMode} sx={{ color: "text.secondary" }}>
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, maxWidth: 1400, mx: "auto", width: "100%" }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
