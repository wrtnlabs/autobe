import { IAutoBePlaygroundBenchmark } from "@autobe/interface";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AutoBePlaygroundExampleProjectCard } from "./AutoBePlaygroundExampleProjectCard";

export function AutoBePlaygroundExampleMovie(
  props: AutoBePlaygroundExampleMovie.IProps,
) {
  const { benchmarks } = props;

  const [selectedVendor, setSelectedVendor] = useState<string>(
    benchmarks.length > 0 ? benchmarks[0].vendor : "",
  );

  if (benchmarks.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const selected = benchmarks.find((b) => b.vendor === selectedVendor);
  const replays = selected?.replays ?? [];

  return (
    <div className="w-full h-full overflow-auto bg-background">
      <div className="mx-auto max-w-screen-lg px-4 py-8">
        {/* Model selector */}
        <div className="flex justify-center mb-8">
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select vendor..." />
            </SelectTrigger>
            <SelectContent>
              {benchmarks.map((b) => (
                <SelectItem key={b.vendor} value={b.vendor}>
                  {b.emoji} {b.vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Project grid */}
        {replays.length === 0 ? (
          <p className="text-center text-muted-foreground mt-16">
            No projects available for this model
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[920px] mx-auto">
            {replays.map((replay) => (
              <AutoBePlaygroundExampleProjectCard
                key={`${replay.vendor}/${replay.project}`}
                replay={replay}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export namespace AutoBePlaygroundExampleMovie {
  export interface IProps {
    benchmarks: IAutoBePlaygroundBenchmark[];
  }
}
