import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

interface ThemeContextValue {
  mode: "dark" | "light";
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  toggleMode: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"dark" | "light">(
    () =>
      (localStorage.getItem("autobe-dashboard-theme") as
        | "dark"
        | "light"
        | null) ?? "dark",
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === "dark" ? "#60a5fa" : "#2563eb" },
          secondary: { main: mode === "dark" ? "#a78bfa" : "#7c3aed" },
          background: {
            default: mode === "dark" ? "#0f172a" : "#f1f5f9",
            paper: mode === "dark" ? "#1e293b" : "#ffffff",
          },
        },
        typography: {
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
        },
      }),
    [mode],
  );

  const toggleMode = useCallback(() => {
    const next = mode === "dark" ? "light" : "dark";
    localStorage.setItem("autobe-dashboard-theme", next);
    setMode(next);
  }, [mode]);

  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
