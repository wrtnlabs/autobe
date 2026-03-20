import { IAutoBePlaygroundSession } from "@autobe/interface";
import { Container } from "@mui/material";

import { AutoBePlaygroundReplayVendorMovie } from "./AutoBePlaygroundReplayVendorMovie";

export const AutoBePlaygroundReplayIndexMovie = ({
  sessions,
}: AutoBePlaygroundReplayIndexMovie.IProps) => {
  const groupedSessions: Record<string, IAutoBePlaygroundSession.ISummary[]> =
    sessions.reduce(
      (acc, session) => {
        const vendorName = session.vendor.name;
        if (!acc[vendorName]) {
          acc[vendorName] = [];
        }
        acc[vendorName].push(session);
        return acc;
      },
      {} as Record<string, IAutoBePlaygroundSession.ISummary[]>,
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
        {Object.entries(groupedSessions).map(([vendor, vendorSessions]) => {
          return (
            <AutoBePlaygroundReplayVendorMovie
              key={vendor}
              vendor={vendor}
              sessions={vendorSessions}
            />
          );
        })}
      </Container>
    </div>
  );
};

export namespace AutoBePlaygroundReplayIndexMovie {
  export interface IProps {
    sessions: IAutoBePlaygroundSession.ISummary[];
  }
}
