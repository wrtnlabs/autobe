import { IAutoBePlaygroundSession } from "@autobe/interface";

import { Separator } from "@/components/ui/separator";

import { AutoBePlaygroundReplayProjectMovie } from "./AutoBePlaygroundReplayProjectMovie";

export const AutoBePlaygroundReplayVendorMovie = ({
  vendor,
  sessions,
}: AutoBePlaygroundReplayVendorMovie.IProps) => {
  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6">
        {vendor}
      </h2>
      <Separator className="mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sessions.map((session) => (
          <AutoBePlaygroundReplayProjectMovie
            key={session.id}
            session={session}
          />
        ))}
      </div>
    </div>
  );
};

export namespace AutoBePlaygroundReplayVendorMovie {
  export interface IProps {
    vendor: string;
    sessions: IAutoBePlaygroundSession.ISummary[];
  }
}
