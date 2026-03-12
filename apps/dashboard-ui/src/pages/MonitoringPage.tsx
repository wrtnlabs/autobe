import { Box, Grid, Typography } from "@mui/material";

import { useMonitoring } from "../hooks/useMonitoring";
import { ConnectionPanel } from "../components/monitoring/ConnectionPanel";
import { PipelineProgress } from "../components/monitoring/PipelineProgress";
import { EventLog } from "../components/monitoring/EventLog";

export function MonitoringPage() {
  const {
    connectionStatus,
    eventGroups,
    phaseStatuses,
    eventCount,
    connect,
    disconnect,
    errorMessage,
  } = useMonitoring();

  const isConnected = connectionStatus === "connected";

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Pipeline Monitoring</Typography>
        <Typography variant="body2" color="text.secondary">
          Real-time monitoring of AutoBE pipeline execution
          {isConnected && ` — ${eventCount} events received`}
        </Typography>
      </Box>

      {/* Connection */}
      <Box sx={{ mb: 3 }}>
        <ConnectionPanel
          status={connectionStatus}
          onConnect={connect}
          onDisconnect={disconnect}
          errorMessage={errorMessage}
        />
      </Box>

      {/* Pipeline + Events */}
      {isConnected && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <PipelineProgress phaseStatuses={phaseStatuses} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <EventLog eventGroups={eventGroups} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
