import { AutoBeHistory } from "@autobe/interface";

import AutoBeAssistantMessage from "../AutoBeAssistantMessage";
import AutoBeUserMessage from "../AutoBeUserMessage";

interface IAutoBeHistoryMovieProps {
  history: AutoBeHistory;
}

const AutoBeHistoryMovie = (props: IAutoBeHistoryMovieProps) => {
  const { history } = props;

  switch (history.type) {
    case "assistantMessage": {
      return (
        <AutoBeAssistantMessage
          text={history.text}
          timestamp={history.created_at}
        />
      );
    }
    case "userMessage":
      return <AutoBeUserMessage message={history.contents} />;
    case "analyze":
    case "prisma":
    case "interface":
    case "realize":
    case "test":
      return <div>{history.type}</div>;
  }
};

export default AutoBeHistoryMovie;
