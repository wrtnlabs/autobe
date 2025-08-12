import {
  AutoBeHistory,
  AutoBeUserMessageHistory,
  AutoBeUserMessageTextContent,
} from "@autobe/interface";

interface IAutoBeUserMessageHistoryMovieProps {
  history: AutoBeUserMessageHistory;
}

const AutoBeUserMessageHistoryMovie = (
  props: IAutoBeUserMessageHistoryMovieProps,
) => {
  const { history } = props;

  return (
    <div>
      {history.contents
        .map((v) => v as AutoBeUserMessageTextContent)
        .map((v) => v.text)}
    </div>
  );
};

export default AutoBeUserMessageHistoryMovie;
