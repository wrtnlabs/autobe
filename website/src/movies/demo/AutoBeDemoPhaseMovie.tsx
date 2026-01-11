import { IAutoBePlaygroundReplay } from "@autobe/interface";

export default function AutoBeDemoPhaseMovie(
  props: AutoBeDemoPhaseMovie.IProps,
) {
  const { phaseName, phase, showTimeColumn } = props;

  // If phase doesn't exist yet (not executed)
  if (!phase) {
    return (
      <tr className="group relative border-b border-gray-700/30 last:border-0 cursor-pointer hover:border-b-2 hover:border-white/60">
        <td className="py-2 pr-3 w-6">
          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
        </td>
        <td className="py-2 pr-1 text-sm">
          <span className="text-gray-500">
            {phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}
          </span>
        </td>
        <td className="py-2 pl-1 text-sm text-gray-500 whitespace-nowrap">-</td>
        {showTimeColumn && (
          <td className="py-2 px-3 text-sm text-gray-500 text-right w-20 whitespace-nowrap">
            -
          </td>
        )}
      </tr>
    );
  }

  // Build commodity details string
  const detail = phase.commodity
    ? Object.entries(phase.commodity)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    : "-";

  // Determine status color
  const getStatusColor = () => {
    if (phase.success === true) return "bg-green-500";
    if (phase.success === false) return "bg-yellow-500";
    return "bg-gray-600";
  };

  const getTextColor = () => {
    if (phase.success === true) return "text-white";
    if (phase.success === false) return "text-yellow-400";
    return "text-gray-500";
  };

  // Format token count with K/M suffix
  const formatTokenCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(2)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Calculate success rate
  const successRate =
    phase.aggregates?.total?.metric?.attempt > 0
      ? (
          (phase.aggregates.total.metric.success /
            phase.aggregates.total.metric.attempt) *
          100
        ).toFixed(1)
      : "0.0";

  return (
    <tr className="group relative border-b border-gray-700/30 last:border-0 cursor-pointer hover:border-b-2 hover:border-white/60">
      <td className="py-2 pr-3 w-6">
        <div className={`w-3 h-3 ${getStatusColor()} rounded-full`}></div>
      </td>
      <td className="py-2 pr-3 text-sm w-20">
        <span className={getTextColor()}>
          {phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}
        </span>
      </td>
      <td className="py-2 pl-1 text-sm text-gray-400 whitespace-nowrap">
        {detail}
      </td>
      {showTimeColumn && (
        <td className="py-2 px-3 text-sm text-gray-400 text-right w-20 whitespace-nowrap">
          {phase.elapsed ? formatElapsedTime(phase.elapsed) : "-"}
        </td>
      )}

      {/* Tooltip */}
      {phase.aggregates?.total && (
        <td className="absolute left-full ml-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 min-w-[200px]">
            <div className="text-xs font-semibold text-white mb-2">
              {phaseName.charAt(0).toUpperCase() + phaseName.slice(1)} Phase
            </div>

            {/* Token Usage */}
            <div className="text-xs text-gray-300 mb-1">
              Token Usage:{" "}
              <span className="text-white font-medium">
                {formatTokenCount(phase.aggregates.total.tokenUsage.total)}
              </span>
            </div>
            <div className="text-[0.65rem] text-gray-400 mb-2 ml-2">
              in:{" "}
              {formatTokenCount(phase.aggregates.total.tokenUsage.input.total)}{" "}
              / out:{" "}
              {formatTokenCount(phase.aggregates.total.tokenUsage.output.total)}
            </div>

            {/* Function Calls */}
            <div className="text-xs text-gray-300">
              Function Calls:{" "}
              <span className="text-white font-medium">
                {phase.aggregates.total.metric.success} /{" "}
                {phase.aggregates.total.metric.attempt}
              </span>{" "}
              <span className="text-green-400">({successRate}%)</span>
            </div>
          </div>
        </td>
      )}
    </tr>
  );
}

export namespace AutoBeDemoPhaseMovie {
  export interface IProps {
    phaseName: string;
    phase: IAutoBePlaygroundReplay.IPhaseState | null;
    showTimeColumn: boolean;
  }
}

// Convert elapsed time from milliseconds to human readable format
function formatElapsedTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const s = seconds % 60;
  const m = minutes % 60;
  const h = hours;

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  } else if (m > 0) {
    return `${m}m ${s}s`;
  } else {
    return `${s}s`;
  }
}
