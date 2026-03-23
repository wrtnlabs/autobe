import { IAutoBePlaygroundReplay } from "@autobe/interface";

export default function AutoBeDemoPhaseMovie(
  props: AutoBeDemoPhaseMovie.IProps,
) {
  const { phaseName, phase, showTimeColumn } = props;

  if (!phase) {
    return (
      <tr className="border-b border-neutral-800/30 last:border-0">
        <td className="py-1.5 pr-3 w-5">
          <div className="w-1.5 h-1.5 bg-neutral-800 rounded-full"></div>
        </td>
        <td className="py-1.5 pr-1 text-xs">
          <span className="text-neutral-700">
            {phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}
          </span>
        </td>
        <td className="py-1.5 pl-1 text-xs text-neutral-800">-</td>
        {showTimeColumn && (
          <td className="py-1.5 px-3 text-xs text-neutral-800 text-right w-16">
            -
          </td>
        )}
      </tr>
    );
  }

  const detail = phase.commodity
    ? Object.entries(phase.commodity)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
    : "-";

  const getStatusColor = () => {
    if (phase.success === true) return "bg-neutral-300";
    if (phase.success === false)
      if (Object.keys(phase.commodity).length !== 0) return "bg-neutral-500";
      else return "bg-neutral-700";
    return "bg-neutral-800";
  };

  const getTextColor = () => {
    if (phase.success === true) return "text-neutral-300";
    if (phase.success === false)
      if (Object.keys(phase.commodity).length !== 0) return "text-neutral-500";
      else return "text-neutral-600";
    return "text-neutral-700";
  };

  return (
    <tr className="border-b border-neutral-800/30 last:border-0">
      <td className="py-1.5 pr-3 w-5">
        <div className={`w-1.5 h-1.5 ${getStatusColor()} rounded-full`}></div>
      </td>
      <td className="py-1.5 pr-3 text-xs w-18">
        <span className={getTextColor()}>
          {phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}
        </span>
      </td>
      <td className="py-1.5 pl-1 text-xs text-neutral-600 whitespace-nowrap">
        {detail}
      </td>
      {showTimeColumn && (
        <td className="py-1.5 px-3 text-xs text-neutral-600 text-right w-16 whitespace-nowrap">
          {phase.elapsed ? formatElapsedTime(phase.elapsed) : "-"}
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
