import { AutoBeHistory } from "@autobe/interface";

import AutoBeUserMessageHistoryMovie from "./AutoBeUserMessageHistoryMovie";

interface IAutoBeHistoryMovieProps {
  history: AutoBeHistory;
}

const AutoBeHistoryMovie = (props: IAutoBeHistoryMovieProps) => {
  const { history } = props;

  switch (history.type) {
    case "analyze":
      break;
    case "assistantMessage":
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
      return <AutoBeUserMessageHistoryMovie history={history} />;
  }
  return <div>AutoBeHistoryMovie</div>;
};

export default AutoBeHistoryMovie;
