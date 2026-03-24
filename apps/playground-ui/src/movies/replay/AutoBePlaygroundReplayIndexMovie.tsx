import { IAutoBePlaygroundSession } from "@autobe/interface";

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
    <div className="w-full h-full overflow-y-auto">
      <div className="mx-auto max-w-screen-lg px-4 sm:px-6 py-4 sm:py-6">
        {Object.entries(groupedSessions).map(([vendor, vendorSessions]) => (
          <AutoBePlaygroundReplayVendorMovie
            key={vendor}
            vendor={vendor}
            sessions={vendorSessions}
          />
        ))}
      </div>
    </div>
  );
};

export namespace AutoBePlaygroundReplayIndexMovie {
  export interface IProps {
    sessions: IAutoBePlaygroundSession.ISummary[];
  }
}
