import { AutoBeEvent, AutoBeHistory } from "@autobe/interface";

import AutoBeHistoryMovie from "./histories/AutoBeHistoryMovie";

interface IChatMovieProps {
  histories: Array<AutoBeHistory>;
  events: Array<AutoBeEvent>;
}

const ChatMovie = (props: IChatMovieProps) => {
  const { histories, events } = props;
  return (
    <div className="flex h-full w-full justify-center">
      <div>
        <div>
          {histories.map((v, i) => (
            <AutoBeHistoryMovie key={i} history={v} />
          ))}
          {events.map((v, i) => (
            <div key={i}>{v.type}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatMovie;
