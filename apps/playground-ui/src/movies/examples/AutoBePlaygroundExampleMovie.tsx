import { IAutoBePlaygroundBenchmark } from "@autobe/interface";
import {
  Box,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";

import { AutoBePlaygroundExampleProjectCard } from "./AutoBePlaygroundExampleProjectCard";

export function AutoBePlaygroundExampleMovie(
  props: AutoBePlaygroundExampleMovie.IProps,
) {
  const theme = useTheme();
  const { benchmarks } = props;

  const [selectedVendor, setSelectedVendor] = useState<string>(
    benchmarks.length > 0 ? benchmarks[0].vendor : "",
  );

  if (benchmarks.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const selected = benchmarks.find((b) => b.vendor === selectedVendor);
  const replays = selected?.replays ?? [];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        bgcolor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Model selector */}
        <Stack alignItems="center" sx={{ mb: 4 }}>
          <FormControl sx={{ minWidth: 300 }} size="small">
            <InputLabel>Vendor / Model</InputLabel>
            <Select
              value={selectedVendor}
              label="Vendor / Model"
              onChange={(e) => setSelectedVendor(e.target.value)}
            >
              {benchmarks.map((b) => (
                <MenuItem key={b.vendor} value={b.vendor}>
                  {b.emoji} {b.vendor}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Project grid */}
        {replays.length === 0 ? (
          <Typography
            sx={{ textAlign: "center", color: "text.secondary", mt: 8 }}
          >
            No projects available for this model
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr",
              },
              gap: 3,
              maxWidth: 920,
              mx: "auto",
            }}
          >
            {replays.map((replay) => (
              <AutoBePlaygroundExampleProjectCard
                key={`${replay.vendor}/${replay.project}`}
                replay={replay}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}
export namespace AutoBePlaygroundExampleMovie {
  export interface IProps {
    benchmarks: IAutoBePlaygroundBenchmark[];
  }
}
