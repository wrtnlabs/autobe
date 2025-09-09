import { IAutoBePlaygroundReplay } from "@autobe/interface";
import { Container } from "@mui/material";

import { AutoBePlaygroundReplayVendorMovie } from "./AutoBePlaygroundReplayVendorMovie";

export const AutoBePlaygroundReplayIndexMovie = ({
  replays,
}: AutoBePlaygroundReplayIndexMovie.IProps) => {
  const groupedReplays: Record<string, IAutoBePlaygroundReplay.ISummary[]> =
    replays.reduce(
      (acc, replay) => {
        if (!acc[replay.vendor]) {
          acc[replay.vendor] = [];
        }
        acc[replay.vendor].push(replay);
        return acc;
      },
      {} as Record<string, IAutoBePlaygroundReplay.ISummary[]>,
    );
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}
      >
        {Object.entries(groupedReplays).map(([vendor, vendorReplays]) => {
          return (
            <AutoBePlaygroundReplayVendorMovie
              key={vendor}
              vendor={vendor}
              replays={vendorReplays}
            />
          );
        })}
      </Container>
    </div>
  );
};

export namespace AutoBePlaygroundReplayIndexMovie {
  export interface IProps {
    replays: IAutoBePlaygroundReplay.ISummary[];
  }
}
