import { AutoBeHistory } from "@autobe/interface";

import AutoBeAssistantMessage from "../AutoBeAssistantMessage";
import AutoBeUserMessage from "../AutoBeUserMessage";

interface IAutoBeHistoryMovieProps {
  history: AutoBeHistory;
}

const AutoBeHistoryMovie = (props: IAutoBeHistoryMovieProps) => {
  const { history } = props;

  switch (history.type) {
    case "analyze":
      break;
    case "assistantMessage":
      return (
        <AutoBeAssistantMessage
          text={history.text}
          timestamp={history.created_at}
        />
      );
      break;
    case "interface":
      break;
    case "prisma":
      break;
    case "realize":
      break;
    case "test":
      break;
    case "userMessage":
      return <AutoBeUserMessage message={history.contents} />;
  }
  return <div>AutoBeHistoryMovie</div>;
};

export default AutoBeHistoryMovie;
