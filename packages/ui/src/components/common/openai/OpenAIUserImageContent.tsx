import { AutoBeUserMessageImageContent } from "@autobe/interface";

/** Image content renderer component for OpenAI messages */
export const OpenAIUserImageContent = ({
  content,
}: {
  content: AutoBeUserMessageImageContent;
}) => {
  const imgSrc =
    content.image.type === "url" ? content.image.url : content.image.data;

  return (
    <div
      style={{
        position: "relative",
        maxWidth: "16rem",
        borderRadius: "0.5rem",
        overflow: "hidden",
      }}
    >
      <img
        src={imgSrc}
        alt="User uploaded image"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
      />
    </div>
  );
};

export default OpenAIUserImageContent;
