import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { BenchmarkEntry } from "../../types/benchmark";

interface PenaltySummaryTableProps {
  entries: BenchmarkEntry[];
}

export function PenaltySummaryTable({ entries }: PenaltySummaryTableProps) {
  const entriesWithPenalties = entries.filter(
    (e) =>
      e.penalties &&
      Object.values(e.penalties).some((p) => p && p.amount > 0),
  );

  if (entriesWithPenalties.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
        <Typography variant="h6" gutterBottom>
          Penalties
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No penalties applied.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: "divider" }}>
      <Typography variant="h6" gutterBottom>
        Penalties
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Project</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Warning
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Duplication
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                JSDoc
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Schema Sync
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Suggestions
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entriesWithPenalties.map((entry) => {
              const p = entry.penalties!;
              const total =
                (p.warning?.amount ?? 0) +
                (p.duplication?.amount ?? 0) +
                (p.jsdoc?.amount ?? 0) +
                (p.schemaSync?.amount ?? 0) +
                (p.suggestionOverflow?.amount ?? 0);
              return (
                <TableRow key={`${entry.model}-${entry.project}`}>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {entry.project}
                  </TableCell>
                  <TableCell align="right">
                    {p.warning ? `-${p.warning.amount.toFixed(1)}` : "--"}
                  </TableCell>
                  <TableCell align="right">
                    {p.duplication ? `-${p.duplication.amount.toFixed(1)}` : "--"}
                  </TableCell>
                  <TableCell align="right">
                    {p.jsdoc ? `-${p.jsdoc.amount.toFixed(1)}` : "--"}
                  </TableCell>
                  <TableCell align="right">
                    {p.schemaSync ? `-${p.schemaSync.amount.toFixed(1)}` : "--"}
                  </TableCell>
                  <TableCell align="right">
                    {p.suggestionOverflow
                      ? `-${p.suggestionOverflow.amount.toFixed(1)}`
                      : "--"}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 700, color: "error.main" }}
                  >
                    -{total.toFixed(1)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
