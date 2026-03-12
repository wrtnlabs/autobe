import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";

import type { ConnectionStatus } from "../../types/monitoring";

interface ConnectionPanelProps {
  status: ConnectionStatus;
  onConnect: (url: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  errorMessage: string | null;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; color: "default" | "warning" | "success" | "error" }
> = {
  disconnected: { label: "Disconnected", color: "default" },
  connecting: { label: "Connecting...", color: "warning" },
  connected: { label: "Connected", color: "success" },
  error: { label: "Error", color: "error" },
};

export function ConnectionPanel({
  status,
  onConnect,
  onDisconnect,
  errorMessage,
}: ConnectionPanelProps) {
  const [serverUrl, setServerUrl] = useState(
    () => localStorage.getItem("autobe-monitor-url") ?? "ws://127.0.0.1:5890",
  );

  const handleConnect = async () => {
    localStorage.setItem("autobe-monitor-url", serverUrl);
    await onConnect(serverUrl);
  };

  const config = STATUS_CONFIG[status];
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <TextField
          size="small"
          label="Server URL"
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          disabled={isConnected || isConnecting}
          sx={{ flexGrow: 1, minWidth: 250 }}
        />
        {isConnected ? (
          <Button
            variant="outlined"
            color="error"
            startIcon={<LinkOffIcon />}
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            onClick={handleConnect}
            disabled={isConnecting || !serverUrl.trim()}
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        )}
        <Chip
          label={config.label}
          color={config.color}
          size="small"
          variant="outlined"
        />
      </Box>
      {errorMessage && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {errorMessage}
        </Alert>
      )}
      {status === "disconnected" && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
          Connect to a running AutoBE playground server to monitor pipeline execution in real-time.
        </Typography>
      )}
    </Paper>
  );
}
