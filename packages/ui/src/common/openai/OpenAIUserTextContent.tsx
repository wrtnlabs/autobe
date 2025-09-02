/** Text content renderer component for OpenAI messages */
export const OpenAIUserTextContent = ({ text }: { text: string }) => (
  <div
    style={{
      position: "relative",
      fontSize: "0.875rem",
      lineHeight: "1.625",
      whiteSpace: "pre-wrap",
    }}
  >
    {text}
  </div>
);

export default OpenAIUserTextContent;
