import { IAutoBePlaygroundReplay } from "@autobe/interface";

export const AutoBePlaygroundReplayIndexMovie = ({
  replays,
}: AutoBePlaygroundReplayIndexMovie.IProps) => {
  return (
    <ul>
      {replays.map((r) => (
        <li>
          <a
            href={`./get.html?vendor=${r.vendor}&project=${r.project}&step=${r.step}`}
            target="_blank"
          >
            {r.vendor} - {r.project}
          </a>
        </li>
      ))}
    </ul>
  );
};
export namespace AutoBePlaygroundReplayIndexMovie {
  export interface IProps {
    replays: IAutoBePlaygroundReplay.ISummary[];
  }
}
