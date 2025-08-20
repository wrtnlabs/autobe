import { AutoBeHistory } from "@autobe/interface";
import {
  AutoBeAssistantMessageMovie,
  AutoBeUserMessageMovie,
} from "@autobe/ui";

import AutoBeAnalyzeHistoryComponent from "./AutoBeAnalyzeHistory";
import AutoBeInterfaceHistoryComponent from "./AutoBeInterfaceHistory";
import AutoBePrismaHistoryComponent from "./AutoBePrismaHistory";
import AutoBeRealizeHistoryComponent from "./AutoBeRealizeHistory";
import AutoBeTestHistoryComponent from "./AutoBeTestHistory";

interface IAutoBeHistoryMovieProps {
  history: AutoBeHistory;
}

const AutoBeHistoryMovie = (props: IAutoBeHistoryMovieProps) => {
  const { history } = props;

  switch (history.type) {
    case "assistantMessage": {
      return (
        <AutoBeAssistantMessageMovie
          text={history.text}
          isoTimestamp={history.created_at}
        />
      );
    }
    case "userMessage":
      return <AutoBeUserMessageMovie message={history.contents} />;
    case "analyze":
      return <AutoBeAnalyzeHistoryComponent history={history} />;
    case "prisma":
      return <AutoBePrismaHistoryComponent history={history} />;
    case "interface":
      return <AutoBeInterfaceHistoryComponent history={history} />;
    case "test":
      return <AutoBeTestHistoryComponent history={history} />;
    case "realize":
      return <AutoBeRealizeHistoryComponent history={history} />;
    default:
      history satisfies never;
      return (
        <div>Unknown history type: {(history as { type: string }).type}</div>
      );
  }
};

export default AutoBeHistoryMovie;
