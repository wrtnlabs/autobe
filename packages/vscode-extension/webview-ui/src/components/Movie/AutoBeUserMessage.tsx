import {
  AutoBeUserMessageContent,
  AutoBeUserMessageHistory,
  AutoBeUserMessageTextContent,
} from "@autobe/interface";

interface IAutoBeUserMessageHistoryMovieProps {
  message: Array<AutoBeUserMessageContent>;
}

const AutoBeUserMessage = (props: IAutoBeUserMessageHistoryMovieProps) => {
  const { message } = props;

  const content = message.filter((v) => v.type === "text");
  return (
    <div className="flex justify-end mb-4">
      <div className="flex-1 max-w-3xl flex flex-col items-end">
        {content.map((v) => (
          <>
            <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {v.text}
              </div>
            </div>
          </>
        ))}
      </div>
    </div>
  );
};

export default AutoBeUserMessage;
