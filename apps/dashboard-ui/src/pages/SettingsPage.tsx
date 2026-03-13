import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { useThemeMode } from "../theme/ThemeContext";
import { loadLangfuseConfig, saveLangfuseConfig } from "../types/langfuse";

export function SettingsPage() {
  const { mode, toggleMode } = useThemeMode();

  const saved = loadLangfuseConfig();
  const [host, setHost] = useState(saved?.host ?? "http://localhost:3001");
  const [publicKey, setPublicKey] = useState(saved?.publicKey ?? "");
  const [secretKey, setSecretKey] = useState(saved?.secretKey ?? "");
  const [testStatus, setTestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [testError, setTestError] = useState("");

  const handleSave = () => {
    saveLangfuseConfig({ host, publicKey, secretKey });
    setTestStatus("idle");
  };

  const handleTest = async () => {
    setTestStatus("loading");
    setTestError("");
    try {
      const res = await fetch("/api/langfuse/traces?limit=1", {
        headers: {
          Authorization: `Basic ${btoa(`${publicKey}:${secretKey}`)}`,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (data.data !== undefined) {
        setTestStatus("success");
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (e) {
      setTestStatus("error");
      setTestError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* Appearance */}
      <Card sx={{ maxWidth: 600, mb: 3 }}>
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

      {/* Langfuse */}
      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Langfuse Integration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Connect to your local Langfuse instance to view LLM call details,
            token usage, and costs inline in the benchmark dashboard.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Host URL"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              size="small"
              placeholder="http://localhost:3001"
              fullWidth
            />
            <TextField
              label="Public Key"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              size="small"
              placeholder="pk-lf-..."
              fullWidth
            />
            <TextField
              label="Secret Key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              size="small"
              type="password"
              placeholder="sk-lf-..."
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button variant="contained" size="small" onClick={handleSave}>
                Save
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleTest}
                disabled={
                  testStatus === "loading" || !publicKey || !secretKey
                }
              >
                {testStatus === "loading" ? (
                  <CircularProgress size={16} sx={{ mr: 1 }} />
                ) : null}
                Test Connection
              </Button>
            </Box>

            {testStatus === "success" && (
              <Alert severity="success" sx={{ mt: 1 }}>
                Connected to Langfuse successfully.
              </Alert>
            )}
            {testStatus === "error" && (
              <Alert severity="error" sx={{ mt: 1 }}>
                Connection failed: {testError}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
