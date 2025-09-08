import { IAutoBeEventGroup } from "../../structure";
import { AutoBeEventMovie } from "./AutoBeEventMovie";

export interface IAutoBeEventGroupMovieProps {
  eventGroups: IAutoBeEventGroup[];
}

export const AutoBeEventGroupMovie = (props: IAutoBeEventGroupMovieProps) => {
  return props.eventGroups.map((e, index) => (
    <AutoBeEventMovie
      key={index}
      events={e.events}
      last={index === props.eventGroups.length - 1}
    />
  ));
};

export default AutoBeEventGroupMovie;
