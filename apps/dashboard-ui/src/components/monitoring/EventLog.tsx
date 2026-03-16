import { useRef, useEffect } from "react";
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { AutoBeEvent } from "@autobe/interface";
import type { IAutoBeEventGroup } from "@autobe/ui";

interface EventLogProps {
  eventGroups: IAutoBeEventGroup[];
}

function getPhaseColor(
  type: string,
): "primary" | "secondary" | "success" | "warning" | "error" | "info" {
  if (type.startsWith("analyze")) return "primary";
  if (type.startsWith("database")) return "secondary";
  if (type.startsWith("interface")) return "info";
  if (type.startsWith("test")) return "warning";
  if (type.startsWith("realize")) return "success";
  return "primary";
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString();
  } catch {
    return "";
  }
}

export function EventLog({ eventGroups }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [eventGroups]);

  const flatEvents: Array<{ type: string; event: AutoBeEvent; count: number }> =
    [];
  for (const group of eventGroups) {
    flatEvents.push({
      type: group.type,
      event: group.events[group.events.length - 1],
      count: group.events.length,
    });
  }

  // Show last 50 event groups
  const recentEvents = flatEvents.slice(-50);

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: "divider" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          pb: 1,
        }}
      >
        <Typography variant="h6">Event Log</Typography>
        <Typography variant="caption" color="text.secondary">
          {flatEvents.length} groups ({eventGroups.reduce((s, g) => s + g.events.length, 0)} events)
        </Typography>
      </Box>
      <TableContainer
        ref={scrollRef}
        sx={{ maxHeight: 400, overflowY: "auto" }}
      >
        {recentEvents.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.disabled">
              No events yet. Events will appear here as the pipeline runs.
            </Typography>
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Event</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 60 }} align="right">
                  Count
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentEvents.map((item, i) => (
                <TableRow key={`${item.type}-${i}`} hover>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                      {formatTime(item.event.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.type}
                      size="small"
                      color={getPhaseColor(item.type)}
                      variant="outlined"
                      sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {item.count > 1 ? `×${item.count}` : ""}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Paper>
  );
}
