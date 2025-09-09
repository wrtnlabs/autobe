import { IAutoBePlaygroundReplay } from "@autobe/interface";
import { Box, Divider, Grid, Typography } from "@mui/material";

import { AutoBePlaygroundReplayProjectMovie } from "./AutoBePlaygroundReplayProjectMovie";

export const AutoBePlaygroundReplayVendorMovie = ({
  vendor,
  replays,
}: AutoBePlaygroundReplayVendorMovie.IProps) => {
  return (
    <Box sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
      <Typography
        variant="h5"
        component="h2"
        sx={{
          mb: { xs: 2, sm: 2.5, md: 3 },
          fontWeight: 600,
          fontSize: { xs: "1.5rem", sm: "1.8rem", md: "2rem" },
        }}
      >
        {vendor}
      </Typography>
      <Divider sx={{ mb: { xs: 1, sm: 1.5 } }} />
      <Typography
        variant="caption"
        sx={{
          mb: { xs: 2, sm: 2.5 },
          display: "block",
          color: "text.secondary",
          fontSize: { xs: "0.65rem", sm: "0.7rem" },
        }}
      >
        A=Actors, D=Documents, N=Namespaces, M=Models, O=Operations, S=Schemas,
        F=Files, E=Errors
      </Typography>
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {replays.map((replay, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }} key={index}>
            <AutoBePlaygroundReplayProjectMovie replay={replay} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export namespace AutoBePlaygroundReplayVendorMovie {
  export interface IProps {
    vendor: string;
    replays: IAutoBePlaygroundReplay.ISummary[];
  }
}
